import Link from "next/link";
import { BookingCard } from "@/components/admin/booking-card";
import { cx, EmptyState } from "@/components/ui";
import { listBookings } from "@/lib/admin-data";
import { STATUS_LABEL, type BookingStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const STATUS_FILTERS: (BookingStatus | "todas")[] = ["todas", "requested", "confirmed", "completed", "cancelled"];

export default async function ReservasPage(props: PageProps<"/admin/reservas">) {
  const sp = await props.searchParams;
  const period = sp.periodo === "anteriores" ? "anteriores" : "proximas";
  const status = STATUS_FILTERS.includes(sp.status as BookingStatus) && sp.status !== "todas" ? (sp.status as BookingStatus) : undefined;
  const bookings = await listBookings({ status, period });

  const href = (p: string, s?: string) => `/admin/reservas?periodo=${p}${s && s !== "todas" ? `&status=${s}` : ""}`;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Reservas</h1>

      <div className="grid grid-cols-2 rounded-xl bg-slate-soft p-1 text-sm font-semibold">
        {(["proximas", "anteriores"] as const).map((p) => (
          <Link
            key={p}
            href={href(p, status)}
            className={cx("rounded-lg py-2 text-center", period === p ? "bg-card shadow-sm" : "text-muted")}
          >
            {p === "proximas" ? "Próximas" : "Anteriores"}
          </Link>
        ))}
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {STATUS_FILTERS.map((s) => {
          const active = (status ?? "todas") === s;
          return (
            <Link
              key={s}
              href={href(period, s)}
              className={cx(
                "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium",
                active ? "border-ink bg-ink text-white" : "border-line bg-card text-ink-soft",
              )}
            >
              {s === "todas" ? "Todas" : STATUS_LABEL[s]}
            </Link>
          );
        })}
      </div>

      {bookings.length ? (
        <div className="space-y-2">
          {bookings.map((b) => (
            <BookingCard key={b.id} booking={b} />
          ))}
        </div>
      ) : (
        <EmptyState>Nenhuma reserva aqui.</EmptyState>
      )}
    </div>
  );
}
