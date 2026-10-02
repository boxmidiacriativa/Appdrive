import "server-only";
import { BRAND } from "./brand";
import { createServiceClient } from "./supabase/service";
import { toNumber, type Driver, type Place, type PublicService, type RoutePriceRow, type Service, type Settings } from "./types";

// Leituras públicas usadas pelo formulário de reserva e pela página da reserva.
// Rodam só no servidor; o navegador recebe apenas os campos necessários.

const DEFAULT_SETTINGS: Settings = {
  business_name: BRAND.name,
  tagline: BRAND.tagline,
  min_advance_hours: 2,
};

export async function getSettings(): Promise<Settings> {
  const db = createServiceClient();
  const { data } = await db.from("settings").select("business_name, tagline, min_advance_hours").maybeSingle();
  return data ?? DEFAULT_SETTINGS;
}

export async function getPublicServices(): Promise<PublicService[]> {
  const db = createServiceClient();
  const { data, error } = await db
    .from("services")
    .select("id, slug, name, description, billing, min_hours")
    .eq("active", true)
    .order("sort_order");
  if (error) throw error;
  return (data ?? []).map((s) => ({ ...s, min_hours: toNumber(s.min_hours) }));
}

export async function getActivePlaces(): Promise<Pick<Place, "id" | "name" | "address">[]> {
  const db = createServiceClient();
  const { data, error } = await db
    .from("places")
    .select("id, name, address")
    .eq("active", true)
    .order("sort_order")
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export function normalizeService(row: Record<string, unknown>): Service {
  return {
    ...(row as unknown as Service),
    base_fee: toNumber(row.base_fee),
    price_per_km: toNumber(row.price_per_km),
    price_per_minute: toNumber(row.price_per_minute),
    price_per_hour: toNumber(row.price_per_hour),
    min_hours: toNumber(row.min_hours),
    minimum_price: toNumber(row.minimum_price),
  };
}

export function normalizeRoutePrice(row: Record<string, unknown>): RoutePriceRow {
  return { ...(row as unknown as RoutePriceRow), price: toNumber(row.price) ?? 0 };
}

export async function getDefaultDriver(): Promise<Driver | null> {
  const db = createServiceClient();
  const { data } = await db
    .from("drivers")
    .select("id, name, whatsapp, vehicle, plate, pix_key_type, pix_key, pix_receiver_name, pix_city, is_default")
    .eq("is_default", true)
    .maybeSingle();
  return data;
}
