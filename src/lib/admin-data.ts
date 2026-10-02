import "server-only";
import { requireAdmin } from "./auth";
import { todayRange } from "./format";
import { toNumber, type BookingStatus, type BookingWithCustomer } from "./types";

// Consultas do painel. Sempre pela sessão do admin (RLS ativo).

export const BOOKING_SELECT = "*, customer:customers(id, name, phone, email)";

export function normalizeBooking(row: Record<string, unknown>): BookingWithCustomer {
  const customer = Array.isArray(row.customer) ? row.customer[0] : row.customer;
  return {
    ...(row as unknown as BookingWithCustomer),
    customer: (customer as BookingWithCustomer["customer"]) ?? null,
    hours: toNumber(row.hours),
    estimated_price: toNumber(row.estimated_price),
    final_price: toNumber(row.final_price),
  };
}

export async function getDashboard() {
  const { supabase } = await requireAdmin();
  const { start, end } = todayRange();

  const [pending, today, upcoming] = await Promise.all([
    supabase.from("bookings").select(BOOKING_SELECT).eq("status", "requested").order("pickup_at"),
    supabase
      .from("bookings")
      .select(BOOKING_SELECT)
      .gte("pickup_at", start.toISOString())
      .lt("pickup_at", end.toISOString())
      .neq("status", "cancelled")
      .order("pickup_at"),
    supabase
      .from("bookings")
      .select(BOOKING_SELECT)
      .gte("pickup_at", end.toISOString())
      .eq("status", "confirmed")
      .order("pickup_at")
      .limit(30),
  ]);

  return {
    pending: (pending.data ?? []).map(normalizeBooking),
    today: (today.data ?? []).map(normalizeBooking),
    upcoming: (upcoming.data ?? []).map(normalizeBooking),
  };
}

export async function listBookings({ status, period }: { status?: BookingStatus; period: "proximas" | "anteriores" }) {
  const { supabase } = await requireAdmin();
  const now = new Date().toISOString();
  let query = supabase.from("bookings").select(BOOKING_SELECT);
  if (status) query = query.eq("status", status);
  query =
    period === "proximas"
      ? query.gte("pickup_at", todayRange().start.toISOString()).order("pickup_at", { ascending: true })
      : query.lt("pickup_at", now).order("pickup_at", { ascending: false });
  const { data } = await query.limit(100);
  return (data ?? []).map(normalizeBooking);
}
