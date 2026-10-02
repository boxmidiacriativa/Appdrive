"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { normalizePhone, parseMoney } from "@/lib/format";
import type { BookingStatus } from "@/lib/types";
import { createSessionClient } from "@/lib/supabase/server";

// Ações do painel. TODAS chamam requireAdmin() e usam a sessão do Gui,
// então o RLS do banco também precisa autorizar cada operação.

const STATUSES: BookingStatus[] = ["requested", "confirmed", "completed", "cancelled"];

function text(form: FormData, key: string, max = 500): string | null {
  const value = String(form.get(key) ?? "").trim().slice(0, max);
  return value || null;
}

function fail(message: string): never {
  throw new Error(message);
}

// ------------------------------------------------------------------ Sessão

export async function signIn(_prev: { error?: string; email?: string } | undefined, form: FormData) {
  const supabase = await createSessionClient();
  const email = String(form.get("email") ?? "").trim();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: String(form.get("password") ?? ""),
  });
  if (error) return { error: "E-mail ou senha incorretos.", email };

  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) {
    await supabase.auth.signOut();
    return { error: "Este usuário não tem acesso ao painel.", email };
  }
  redirect("/admin");
}

export async function signOut() {
  const supabase = await createSessionClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

// ------------------------------------------------------------------ Reservas

function bookingPaths(id: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/reservas");
  revalidatePath(`/admin/reservas/${id}`);
}

export async function confirmBooking(id: string, form: FormData) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("bookings")
    .update({
      status: "confirmed",
      final_price: parseMoney(form.get("final_price")),
      driver_message: text(form, "driver_message"),
      confirmed_at: new Date().toISOString(),
      cancelled_at: null,
      cancel_reason: null,
    })
    .eq("id", id);
  if (error) fail("Não foi possível confirmar a reserva.");
  bookingPaths(id);
  redirect(`/admin/reservas/${id}?ok=confirmada`);
}

export async function updateBookingTerms(id: string, form: FormData) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("bookings")
    .update({ final_price: parseMoney(form.get("final_price")), driver_message: text(form, "driver_message") })
    .eq("id", id);
  if (error) fail("Não foi possível salvar.");
  bookingPaths(id);
  redirect(`/admin/reservas/${id}?ok=salvo`);
}

export async function setBookingStatus(id: string, form: FormData) {
  const { supabase } = await requireAdmin();
  const status = String(form.get("status")) as BookingStatus;
  if (!STATUSES.includes(status)) fail("Status inválido.");

  const now = new Date().toISOString();
  const patch: Record<string, unknown> = { status };
  if (status === "confirmed") Object.assign(patch, { confirmed_at: now, cancelled_at: null, cancel_reason: null });
  if (status === "completed") Object.assign(patch, { completed_at: now });
  if (status === "cancelled") Object.assign(patch, { cancelled_at: now, cancel_reason: text(form, "cancel_reason", 300) });
  if (status === "requested") Object.assign(patch, { cancelled_at: null, cancel_reason: null });

  const { error } = await supabase.from("bookings").update(patch).eq("id", id);
  if (error) fail("Não foi possível alterar o status.");
  bookingPaths(id);
  redirect(`/admin/reservas/${id}?ok=status`);
}

export async function setPaymentStatus(id: string, paid: boolean) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("bookings")
    .update({ payment_status: paid ? "paid" : "pending", paid_at: paid ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) fail("Não foi possível atualizar o pagamento.");
  bookingPaths(id);
  redirect(`/admin/reservas/${id}`);
}

// ------------------------------------------------------------------ Clientes

export async function updateCustomer(id: string, form: FormData) {
  const { supabase } = await requireAdmin();
  const name = text(form, "name", 80);
  if (!name) fail("Informe o nome.");
  const { error } = await supabase
    .from("customers")
    .update({ name, email: text(form, "email", 120), notes: text(form, "notes", 1000) })
    .eq("id", id);
  if (error) fail("Não foi possível salvar o cliente.");
  revalidatePath("/admin/clientes");
  revalidatePath(`/admin/clientes/${id}`);
  redirect(`/admin/clientes/${id}?ok=1`);
}

// ------------------------------------------------------------------ Preços

export async function updateService(id: string, form: FormData) {
  const { supabase } = await requireAdmin();
  const name = text(form, "name", 60);
  if (!name) fail("Informe o nome do serviço.");
  const minHours = parseMoney(form.get("min_hours"));
  const { error } = await supabase
    .from("services")
    .update({
      name,
      description: text(form, "description", 200),
      active: form.get("active") === "on",
      base_fee: parseMoney(form.get("base_fee")),
      price_per_km: parseMoney(form.get("price_per_km")),
      price_per_minute: parseMoney(form.get("price_per_minute")),
      price_per_hour: parseMoney(form.get("price_per_hour")),
      min_hours: minHours,
      minimum_price: parseMoney(form.get("minimum_price")),
    })
    .eq("id", id);
  if (error) fail("Não foi possível salvar o serviço.");
  revalidatePath("/admin/precos");
  revalidatePath("/");
  redirect("/admin/precos?ok=servico");
}

export async function savePlace(id: string | null, form: FormData) {
  const { supabase } = await requireAdmin();
  const name = text(form, "name", 120);
  if (!name) fail("Informe o nome do local.");
  const row = { name, address: text(form, "address", 200), active: id ? form.get("active") === "on" : true };
  const { error } = id
    ? await supabase.from("places").update(row).eq("id", id)
    : await supabase.from("places").insert(row);
  if (error) fail("Não foi possível salvar o local.");
  revalidatePath("/admin/precos");
  revalidatePath("/");
  redirect("/admin/precos?ok=local#locais");
}

export async function createRoutePrice(form: FormData) {
  const { supabase } = await requireAdmin();
  const origin = String(form.get("origin_place_id") ?? "");
  const destination = String(form.get("destination_place_id") ?? "");
  const price = parseMoney(form.get("price"));
  const serviceId = String(form.get("service_id") ?? "") || null;
  if (!origin || !destination || origin === destination || price === null) {
    redirect("/admin/precos?erro=rota#rotas");
  }
  const { error } = await supabase.from("route_prices").insert({
    origin_place_id: origin,
    destination_place_id: destination,
    service_id: serviceId,
    price,
    both_directions: form.get("both_directions") === "on",
  });
  if (error) fail("Não foi possível salvar a rota.");
  revalidatePath("/admin/precos");
  redirect("/admin/precos?ok=rota#rotas");
}

export async function deleteRoutePrice(id: string) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("route_prices").delete().eq("id", id);
  if (error) fail("Não foi possível remover a rota.");
  revalidatePath("/admin/precos");
  redirect("/admin/precos#rotas");
}

// ------------------------------------------------------------------ Ajustes

export async function updateSettings(form: FormData) {
  const { supabase } = await requireAdmin();
  const minAdvance = Math.min(168, Math.max(0, Math.round(Number(form.get("min_advance_hours") ?? 2)) || 0));
  const { error } = await supabase
    .from("settings")
    .update({
      business_name: text(form, "business_name", 60) ?? "Motorista Gui",
      tagline: text(form, "tagline", 120) ?? "",
      min_advance_hours: minAdvance,
    })
    .eq("id", true);
  if (error) fail("Não foi possível salvar.");
  revalidatePath("/", "layout");
  redirect("/admin/ajustes?ok=geral");
}

export async function updateDriver(id: string, form: FormData) {
  const { supabase } = await requireAdmin();
  const name = text(form, "name", 60);
  if (!name) fail("Informe o nome do motorista.");
  const whatsapp = text(form, "whatsapp", 30);
  const keyType = String(form.get("pix_key_type") ?? "");
  const { error } = await supabase
    .from("drivers")
    .update({
      name,
      whatsapp: whatsapp ? normalizePhone(whatsapp) : null,
      vehicle: text(form, "vehicle", 80),
      plate: text(form, "plate", 10)?.toUpperCase() ?? null,
      pix_key_type: ["cpf", "cnpj", "phone", "email", "random"].includes(keyType) ? keyType : null,
      pix_key: text(form, "pix_key", 77),
      pix_receiver_name: text(form, "pix_receiver_name", 25),
      pix_city: text(form, "pix_city", 15),
    })
    .eq("id", id);
  if (error) fail("Não foi possível salvar o motorista.");
  revalidatePath("/", "layout");
  redirect("/admin/ajustes?ok=motorista");
}
