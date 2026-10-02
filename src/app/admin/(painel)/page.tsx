import { BookingCard } from "@/components/admin/booking-card";
import { EmptyState } from "@/components/ui";
import { getDashboard } from "@/lib/admin-data";
import { formatLongDate, localDateKey } from "@/lib/format";
import type { BookingWithCustomer } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const { pending, today, upcoming } = await getDashboard();

  // Agrupa as próximas reservas por dia
  const byDay = new Map<string, BookingWithCustomer[]>();
  for (const b of upcoming) {
    const key = localDateKey(b.pickup_at);
    byDay.set(key, [...(byDay.get(key) ?? []), b]);
  }

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm font-medium text-muted first-letter:uppercase">{formatLongDate(new Date())}</p>
        <h1 className="text-2xl font-bold">Hoje</h1>
      </header>

      {pending.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-warn">
            <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-warn px-1.5 text-xs text-white">
              {pending.length}
            </span>
            Aguardando sua confirmação
          </h2>
          <div className="space-y-2">
            {pending.map((b) => (
              <BookingCard key={b.id} booking={b} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-sm font-bold text-muted">Reservas de hoje</h2>
        {today.length ? (
          <div className="space-y-2">
            {today.map((b) => (
              <BookingCard key={b.id} booking={b} showDate={false} />
            ))}
          </div>
        ) : (
          <EmptyState>Nenhuma reserva para hoje.</EmptyState>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-bold text-muted">Próximas reservas confirmadas</h2>
        {byDay.size ? (
          <div className="space-y-5">
            {[...byDay.entries()].map(([day, items]) => (
              <div key={day}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
                  {formatLongDate(`${day}T12:00:00-03:00`)}
                </p>
                <div className="space-y-2">
                  {items.map((b) => (
                    <BookingCard key={b.id} booking={b} showDate={false} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState>Nenhuma reserva confirmada nos próximos dias.</EmptyState>
        )}
      </section>
    </div>
  );
}
