import Link from "next/link";
import { NewBookingForm } from "@/components/admin/new-booking-form";
import { IconArrowLeft } from "@/components/icons";
import { requireAdmin } from "@/lib/auth";
import { localDateKey } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function NovaReservaPage() {
  const { supabase } = await requireAdmin();
  const [{ data: services }, { data: places }] = await Promise.all([
    supabase.from("services").select("id, name, billing").eq("active", true).order("sort_order"),
    supabase.from("places").select("id, name").eq("active", true).order("sort_order").order("name"),
  ]);

  return (
    <div className="space-y-5">
      <Link href="/admin" className="-ml-1 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft">
        <IconArrowLeft className="h-4 w-4" /> Voltar
      </Link>
      <header>
        <h1 className="text-2xl font-bold">Nova reserva</h1>
        <p className="mt-1 text-sm text-muted">
          Para clientes que combinaram com você por WhatsApp ou telefone. A reserva entra na agenda e gera o link com o Pix.
        </p>
      </header>
      <NewBookingForm services={services ?? []} places={places ?? []} today={localDateKey(new Date())} />
    </div>
  );
}
