import { BookingFlow } from "@/components/booking-flow";
import { IconCalendar, IconShield, IconTag } from "@/components/icons";
import { MyBookings } from "@/components/my-bookings";
import { getActivePlaces, getPublicServices, getSettings } from "@/lib/data";
import { localDateKey } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [settings, services, places] = await Promise.all([getSettings(), getPublicServices(), getActivePlaces()]);

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-4 pb-16">
      <header className="pt-8 pb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-accent">{settings.business_name}</p>
        <h1 className="mt-2 text-[28px] leading-tight font-bold text-ink">Reserve seu motorista</h1>
        <p className="mt-2 text-[15px] text-muted">{settings.tagline}</p>
      </header>

      <BookingFlow services={services} places={places} today={localDateKey(new Date())} />

      <MyBookings />

      <ul className="mt-10 grid grid-cols-3 gap-3 text-center text-xs leading-snug text-muted">
        <li className="flex flex-col items-center gap-2 px-1">
          <IconCalendar className="h-5 w-5 text-accent" />
          Hora marcada, sem surpresa
        </li>
        <li className="flex flex-col items-center gap-2 px-1">
          <IconShield className="h-5 w-5 text-accent" />
          Confirmação pelo próprio motorista
        </li>
        <li className="flex flex-col items-center gap-2 px-1">
          <IconTag className="h-5 w-5 text-accent" />
          Valor antes de reservar
        </li>
      </ul>
    </main>
  );
}
