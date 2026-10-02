import { BookingFlow } from "@/components/booking-flow";
import { Logo } from "@/components/brand";
import { IconCalendar, IconShield, IconTag } from "@/components/icons";
import { InstallHint } from "@/components/install-hint";
import { MyBookings } from "@/components/my-bookings";
import { getActivePlaces, getPublicServices, getSettings } from "@/lib/data";
import { localDateKey } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [settings, services, places] = await Promise.all([getSettings(), getPublicServices(), getActivePlaces()]);

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-4 pb-16">
      <header className="pt-8 pb-6">
        <Logo name={settings.business_name} tagline={settings.tagline} />
        <h1 className="mt-8 text-[28px] leading-tight font-bold text-ink">Reserve seu motorista</h1>
        <p className="mt-2 text-[15px] text-muted">Transfer, viagens e motorista por período, com hora marcada. Vai de Gui.</p>
      </header>

      <BookingFlow services={services} places={places} today={localDateKey(new Date())} />

      <MyBookings />

      <InstallHint />

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
