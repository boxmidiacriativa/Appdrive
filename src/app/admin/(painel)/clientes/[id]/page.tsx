import Link from "next/link";
import { notFound } from "next/navigation";
import { updateCustomer } from "@/app/admin/actions";
import { BookingCard } from "@/components/admin/booking-card";
import { SubmitButton } from "@/components/admin/submit-button";
import { IconArrowLeft } from "@/components/icons";
import { Card, EmptyState, Input, Label, Textarea, WhatsAppButton } from "@/components/ui";
import { BOOKING_SELECT, normalizeBooking } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/auth";
import { formatDate, formatMoney, formatPhone } from "@/lib/format";
import { priceOf } from "@/lib/types";
import { whatsappLink } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export default async function ClienteDetalhe(props: PageProps<"/admin/clientes/[id]">) {
  const { id } = await props.params;
  const sp = await props.searchParams;
  const { supabase } = await requireAdmin();

  const { data: customer } = await supabase.from("customers").select("*").eq("id", id).maybeSingle();
  if (!customer) notFound();
  const { data: rows } = await supabase
    .from("bookings")
    .select(BOOKING_SELECT)
    .eq("customer_id", id)
    .order("pickup_at", { ascending: false });
  const bookings = (rows ?? []).map(normalizeBooking);
  const completed = bookings.filter((b) => b.status === "completed");
  const total = completed.reduce((sum, b) => sum + (priceOf(b) ?? 0), 0);
  const save = updateCustomer.bind(null, id);

  return (
    <div className="space-y-5">
      <Link href="/admin/clientes" className="-ml-1 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft">
        <IconArrowLeft className="h-4 w-4" /> Clientes
      </Link>

      <header>
        <h1 className="text-2xl font-bold">{customer.name}</h1>
        <p className="text-muted">
          <a href={`tel:+${customer.phone}`}>{formatPhone(customer.phone)}</a> · cliente desde {formatDate(customer.created_at, { weekday: undefined, year: "numeric" })}
        </p>
      </header>

      <div className="grid grid-cols-3 gap-2 text-center">
        <Card className="px-2 py-3">
          <p className="text-xl font-bold">{bookings.length}</p>
          <p className="text-xs text-muted">reservas</p>
        </Card>
        <Card className="px-2 py-3">
          <p className="text-xl font-bold">{completed.length}</p>
          <p className="text-xs text-muted">concluídas</p>
        </Card>
        <Card className="px-2 py-3">
          <p className="text-base font-bold leading-7">{formatMoney(total)}</p>
          <p className="text-xs text-muted">em viagens</p>
        </Card>
      </div>

      <WhatsAppButton href={whatsappLink(customer.phone, `Olá, ${customer.name.split(" ")[0]}!`)}>Falar pelo WhatsApp</WhatsAppButton>

      <section>
        <h2 className="mb-3 text-sm font-bold text-muted">Histórico</h2>
        {bookings.length ? (
          <div className="space-y-2">
            {bookings.map((b) => (
              <BookingCard key={b.id} booking={b} />
            ))}
          </div>
        ) : (
          <EmptyState>Sem reservas.</EmptyState>
        )}
      </section>

      <Card className="p-5">
        <h2 className="text-base font-bold">Dados e anotações</h2>
        {sp.ok && <p className="mt-2 text-sm text-ok">Salvo.</p>}
        <form action={save} className="mt-4 space-y-4">
          <div>
            <Label htmlFor="name">Nome</Label>
            <Input id="name" name="name" defaultValue={customer.name} required />
          </div>
          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" name="email" type="email" defaultValue={customer.email ?? ""} />
          </div>
          <div>
            <Label htmlFor="notes" hint="só você vê">
              Anotações
            </Label>
            <Textarea id="notes" name="notes" defaultValue={customer.notes ?? ""} placeholder="Preferências, endereço de casa, observações…" />
          </div>
          <SubmitButton variant="secondary" full>
            Salvar
          </SubmitButton>
        </form>
      </Card>
    </div>
  );
}
