import Link from "next/link";
import { formatDate, formatMoney, formatTime } from "@/lib/format";
import { priceOf, type BookingWithCustomer } from "@/lib/types";
import { IconChevronRight } from "../icons";
import { StatusBadge } from "../ui";

export function BookingCard({ booking, showDate = true }: { booking: BookingWithCustomer; showDate?: boolean }) {
  const price = priceOf(booking);
  return (
    <Link
      href={`/admin/reservas/${booking.id}`}
      className="flex items-stretch gap-4 rounded-2xl border border-line bg-card px-4 py-3.5 active:bg-paper"
    >
      <div className="flex w-14 shrink-0 flex-col justify-center border-r border-line pr-3 text-center">
        <span className="text-lg font-bold tabular-nums">{formatTime(booking.pickup_at)}</span>
        {showDate && <span className="text-[11px] leading-tight text-muted">{formatDate(booking.pickup_at)}</span>}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-[15px] font-semibold">{booking.customer?.name ?? "Cliente"}</span>
          <StatusBadge status={booking.status} />
        </div>
        <p className="mt-0.5 truncate text-sm text-ink-soft">
          {booking.origin}
          {booking.destination ? ` → ${booking.destination}` : ""}
        </p>
        <p className="mt-0.5 text-xs text-muted">
          {booking.service_name} · {booking.passengers} pass. · {price !== null ? formatMoney(price) : "valor a definir"}
          {booking.status === "confirmed" && booking.payment_status === "pending" && price !== null ? " · Pix pendente" : ""}
        </p>
      </div>
      <IconChevronRight className="h-5 w-5 self-center text-muted" />
    </Link>
  );
}
