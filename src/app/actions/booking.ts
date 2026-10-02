"use server";

import { randomBytes, randomInt } from "node:crypto";
import { z } from "zod";
import { getSettings, normalizeRoutePrice, normalizeService } from "@/lib/data";
import { formatLongDate, formatTime, isValidBrPhone, normalizePhone, toPickupAt } from "@/lib/format";
import { estimateRoute } from "@/lib/maps";
import { customerToDriverMessage } from "@/lib/messages";
import { notifyNewBooking } from "@/lib/notify";
import { calculatePrice, type PriceSource } from "@/lib/pricing";
import { siteUrl } from "@/lib/site";
import { createServiceClient } from "@/lib/supabase/service";
import type { Service } from "@/lib/types";

// Ações públicas do cliente. Tudo é validado de novo aqui: o servidor nunca
// confia no preço nem nos dados vindos do navegador.

const tripSchema = z.object({
  serviceId: z.uuid({ message: "Escolha o serviço" }),
  origin: z.string().trim().min(3, "Informe o local de origem").max(200),
  originPlaceId: z.uuid().optional().nullable(),
  destination: z.string().trim().max(200).optional().nullable(),
  destinationPlaceId: z.uuid().optional().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe a data"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Informe o horário"),
  passengers: z.coerce.number().int().min(1, "Mínimo 1 passageiro").max(20, "Máximo 20 passageiros"),
  hours: z.coerce.number().min(0.5).max(24).optional().nullable(),
});

const contactSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome").max(80),
  phone: z.string().trim().refine(isValidBrPhone, "Informe um WhatsApp válido com DDD"),
  email: z.union([z.literal(""), z.email("E-mail inválido")]).optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable(),
  website: z.string().optional().nullable(), // campo-isca contra robôs: deve vir vazio
});

export type TripInput = z.input<typeof tripSchema>;
export type ContactInput = z.input<typeof contactSchema>;
type FieldErrors = Record<string, string[] | undefined>;

export type QuoteResult =
  | { ok: true; price: number | null; source: PriceSource; billedHours?: number }
  | { ok: false; errors: FieldErrors; message?: string };

export type CreateResult = { ok: true; token: string; code: string } | { ok: false; errors: FieldErrors; message?: string };

type Resolved = {
  service: Service;
  origin: string;
  originPlaceId: string | null;
  destination: string | null;
  destinationPlaceId: string | null;
  pickupAt: Date;
  passengers: number;
  hours: number | null;
};

async function resolveTrip(input: TripInput): Promise<{ ok: true; trip: Resolved } | { ok: false; errors: FieldErrors; message?: string }> {
  const parsed = tripSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: z.flattenError(parsed.error).fieldErrors };
  const data = parsed.data;
  const db = createServiceClient();

  const { data: serviceRow } = await db.from("services").select("*").eq("id", data.serviceId).eq("active", true).maybeSingle();
  if (!serviceRow) return { ok: false, errors: { serviceId: ["Serviço indisponível"] } };
  const service = normalizeService(serviceRow);

  const errors: FieldErrors = {};
  if (service.billing === "trip" && !data.destination) errors.destination = ["Informe o destino"];
  if (service.billing === "hourly" && !data.hours) errors.hours = ["Informe por quantas horas"];

  const pickupAt = toPickupAt(data.date, data.time);
  const settings = await getSettings();
  const earliest = Date.now() + settings.min_advance_hours * 60 * 60 * 1000;
  if (Number.isNaN(pickupAt.getTime())) errors.date = ["Data inválida"];
  else if (pickupAt.getTime() < earliest)
    errors.time = [
      settings.min_advance_hours > 0
        ? `Reservas com pelo menos ${settings.min_advance_hours}h de antecedência`
        : "Escolha um horário futuro",
    ];
  else if (pickupAt.getTime() > Date.now() + 366 * 24 * 60 * 60 * 1000) errors.date = ["Data muito distante"];
  if (Object.keys(errors).length) return { ok: false, errors };

  // Locais frequentes: o nome oficial vem do banco, não do navegador
  const placeIds = [data.originPlaceId, data.destinationPlaceId].filter((id): id is string => !!id);
  const places = new Map<string, { name: string; address: string | null }>();
  if (placeIds.length) {
    const { data: rows } = await db.from("places").select("id, name, address").in("id", placeIds).eq("active", true);
    rows?.forEach((p) => places.set(p.id, p));
  }
  const originPlace = data.originPlaceId ? places.get(data.originPlaceId) : undefined;
  const destPlace = data.destinationPlaceId ? places.get(data.destinationPlaceId) : undefined;

  return {
    ok: true,
    trip: {
      service,
      origin: originPlace ? originPlace.name : data.origin,
      originPlaceId: originPlace ? data.originPlaceId! : null,
      destination: destPlace ? destPlace.name : data.destination || null,
      destinationPlaceId: destPlace ? data.destinationPlaceId! : null,
      pickupAt,
      passengers: data.passengers,
      hours: service.billing === "hourly" ? (data.hours ?? null) : null,
    },
  };
}

async function priceFor(trip: Resolved) {
  const db = createServiceClient();
  const { data: routeRows } = await db.from("route_prices").select("*").eq("active", true);
  const estimate =
    trip.service.billing === "trip" && trip.destination ? await estimateRoute(trip.origin, trip.destination) : null;
  const result = calculatePrice({
    service: trip.service,
    originPlaceId: trip.originPlaceId,
    destinationPlaceId: trip.destinationPlaceId,
    hours: trip.hours,
    routePrices: (routeRows ?? []).map(normalizeRoutePrice),
    estimate,
  });
  return { ...result, estimate };
}

export async function quoteBooking(input: TripInput): Promise<QuoteResult> {
  try {
    const resolved = await resolveTrip(input);
    if (!resolved.ok) return resolved;
    const { price, source, billedHours } = await priceFor(resolved.trip);
    return { ok: true, price, source, billedHours };
  } catch (error) {
    console.error(error);
    return { ok: false, errors: {}, message: "Não foi possível calcular agora. Tente novamente." };
  }
}

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function newCode() {
  return Array.from({ length: 6 }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join("");
}

export async function createBooking(tripInput: TripInput, contactInput: ContactInput): Promise<CreateResult> {
  try {
    const contact = contactSchema.safeParse(contactInput);
    if (!contact.success) return { ok: false, errors: z.flattenError(contact.error).fieldErrors };
    if (contact.data.website) return { ok: false, errors: {}, message: "Não foi possível enviar." };

    const resolved = await resolveTrip(tripInput);
    if (!resolved.ok) return resolved;
    const trip = resolved.trip;
    const { price, source, estimate } = await priceFor(trip);

    const db = createServiceClient();
    const phone = normalizePhone(contact.data.phone);
    const email = contact.data.email || null;

    // Cliente recorrente é reconhecido pelo telefone
    const { data: existing } = await db.from("customers").select("id, email").eq("phone", phone).maybeSingle();
    let customerId: string;
    if (existing) {
      customerId = existing.id;
      await db
        .from("customers")
        .update({ name: contact.data.name, email: email ?? existing.email })
        .eq("id", existing.id);
    } else {
      const { data: created, error } = await db
        .from("customers")
        .insert({ name: contact.data.name, phone, email })
        .select("id")
        .single();
      if (error || !created) throw error ?? new Error("Falha ao criar cliente");
      customerId = created.id;
    }

    const { data: driver } = await db.from("drivers").select("id").eq("is_default", true).maybeSingle();
    const accessToken = randomBytes(24).toString("base64url");

    let booking: { code: string; access_token: string } | null = null;
    for (let attempt = 0; attempt < 5 && !booking; attempt++) {
      const { data, error } = await db
        .from("bookings")
        .insert({
          code: newCode(),
          access_token: accessToken,
          customer_id: customerId,
          driver_id: driver?.id ?? null,
          service_id: trip.service.id,
          service_name: trip.service.name,
          service_billing: trip.service.billing,
          origin: trip.origin,
          origin_place_id: trip.originPlaceId,
          destination: trip.destination,
          destination_place_id: trip.destinationPlaceId,
          pickup_at: trip.pickupAt.toISOString(),
          hours: trip.hours,
          passengers: trip.passengers,
          notes: contact.data.notes || null,
          distance_km: estimate?.distanceKm ?? null,
          duration_min: estimate?.durationMin ?? null,
          estimated_price: price,
          price_source: source,
        })
        .select("code, access_token")
        .single();
      if (data) booking = data;
      else if (error?.code !== "23505") throw error; // 23505 = código repetido, tenta outro
    }
    if (!booking) throw new Error("Não foi possível gerar o código da reserva");

    const base = await siteUrl();
    await notifyNewBooking(
      `Nova solicitação ${booking.code} — ${formatLongDate(trip.pickupAt)} ${formatTime(trip.pickupAt)}`,
      customerToDriverMessage(
        {
          code: booking.code,
          service_name: trip.service.name,
          service_billing: trip.service.billing,
          origin: trip.origin,
          destination: trip.destination,
          pickup_at: trip.pickupAt.toISOString(),
          hours: trip.hours,
          passengers: trip.passengers,
          final_price: null,
          estimated_price: price,
        },
        `${contact.data.name} (${contact.data.phone})`,
        `${base}/admin`,
      ),
    );

    return { ok: true, token: booking.access_token, code: booking.code };
  } catch (error) {
    console.error(error);
    return { ok: false, errors: {}, message: "Não foi possível enviar sua solicitação. Tente novamente em instantes." };
  }
}
