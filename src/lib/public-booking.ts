import "server-only";
import { createServiceClient } from "./supabase/service";
import { toNumber, type Booking, type Driver } from "./types";

// Busca a reserva pelo link secreto. Devolve só o que o cliente pode ver:
// nada de anotações internas nem dados de outros clientes.

export type PublicBooking = Pick<
  Booking,
  | "code"
  | "service_name"
  | "service_billing"
  | "origin"
  | "destination"
  | "pickup_at"
  | "hours"
  | "passengers"
  | "notes"
  | "estimated_price"
  | "final_price"
  | "price_source"
  | "driver_message"
  | "status"
  | "payment_status"
  | "cancel_reason"
> & {
  customerName: string;
  driver: Pick<Driver, "name" | "whatsapp" | "vehicle" | "plate" | "pix_key_type" | "pix_key" | "pix_receiver_name" | "pix_city"> | null;
};

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{32}$/;

export async function getBookingByToken(token: string): Promise<PublicBooking | null> {
  if (!TOKEN_PATTERN.test(token)) return null;
  const db = createServiceClient();
  const { data } = await db
    .from("bookings")
    .select(
      `code, service_name, service_billing, origin, destination, pickup_at, hours, passengers, notes,
       estimated_price, final_price, price_source, driver_message, status, payment_status, cancel_reason, driver_id,
       customer:customers(name)`,
    )
    .eq("access_token", token)
    .maybeSingle();
  if (!data) return null;

  let driverQuery = db
    .from("drivers")
    .select("name, whatsapp, vehicle, plate, pix_key_type, pix_key, pix_receiver_name, pix_city");
  driverQuery = data.driver_id ? driverQuery.eq("id", data.driver_id) : driverQuery.eq("is_default", true);
  const { data: driver } = await driverQuery.maybeSingle();

  const customer = Array.isArray(data.customer) ? data.customer[0] : data.customer;
  const { driver_id: _driverId, customer: _customer, ...rest } = data;
  void _driverId;
  void _customer;

  return {
    ...rest,
    hours: toNumber(rest.hours),
    estimated_price: toNumber(rest.estimated_price),
    final_price: toNumber(rest.final_price),
    customerName: (customer as { name?: string } | null)?.name ?? "",
    driver,
  };
}
