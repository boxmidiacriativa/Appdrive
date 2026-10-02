import type { PriceSource, ServiceBilling } from "./pricing";
import type { PixKeyType } from "./pix";

export type BookingStatus = "requested" | "confirmed" | "completed" | "cancelled";
export type PaymentStatus = "pending" | "paid";

export type Settings = {
  business_name: string;
  tagline: string;
  min_advance_hours: number;
};

export type Service = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  billing: ServiceBilling;
  base_fee: number | null;
  price_per_km: number | null;
  price_per_minute: number | null;
  price_per_hour: number | null;
  min_hours: number | null;
  minimum_price: number | null;
  active: boolean;
  sort_order: number;
};

export type PublicService = Pick<Service, "id" | "slug" | "name" | "description" | "billing" | "min_hours">;

export type Place = {
  id: string;
  name: string;
  address: string | null;
  active: boolean;
  sort_order: number;
};

export type RoutePriceRow = {
  id: string;
  service_id: string | null;
  origin_place_id: string;
  destination_place_id: string;
  price: number;
  both_directions: boolean;
  active: boolean;
};

export type Driver = {
  id: string;
  name: string;
  whatsapp: string | null;
  vehicle: string | null;
  plate: string | null;
  pix_key_type: PixKeyType | null;
  pix_key: string | null;
  pix_receiver_name: string | null;
  pix_city: string | null;
  is_default: boolean;
};

export type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  notes: string | null;
  created_at: string;
};

export type Booking = {
  id: string;
  code: string;
  access_token: string;
  customer_id: string;
  driver_id: string | null;
  service_id: string | null;
  service_name: string;
  service_billing: ServiceBilling;
  origin: string;
  destination: string | null;
  pickup_at: string;
  hours: number | null;
  passengers: number;
  notes: string | null;
  estimated_price: number | null;
  price_source: PriceSource;
  final_price: number | null;
  driver_message: string | null;
  status: BookingStatus;
  payment_status: PaymentStatus;
  paid_at: string | null;
  confirmed_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  created_at: string;
};

export type BookingWithCustomer = Booking & { customer: Pick<Customer, "id" | "name" | "phone" | "email"> | null };

export const STATUS_LABEL: Record<BookingStatus, string> = {
  requested: "Solicitada",
  confirmed: "Confirmada",
  completed: "Concluída",
  cancelled: "Cancelada",
};

export const BILLING_LABEL: Record<ServiceBilling, string> = {
  trip: "Trajeto",
  hourly: "Por hora",
};

// Supabase devolve numeric como string: converte campos numéricos para number
export function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function priceOf(booking: Pick<Booking, "final_price" | "estimated_price">): number | null {
  return toNumber(booking.final_price) ?? toNumber(booking.estimated_price);
}
