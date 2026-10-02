import Link from "next/link";
import { notFound } from "next/navigation";
import { confirmBooking, setBookingStatus, setPaymentStatus, updateBookingTerms } from "@/app/admin/actions";
import { SubmitButton } from "@/components/admin/submit-button";
import { CopyButton } from "@/components/copy-button";
import { IconArrowLeft } from "@/components/icons";
import { Card, InfoRow, Input, Label, Select, StatusBadge, Textarea, WhatsAppButton } from "@/components/ui";
import { BOOKING_SELECT, normalizeBooking } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/auth";
import { formatDate, formatHours, formatLongDate, formatMoney, formatPhone, formatTime } from "@/lib/format";
import { confirmationMessage } from "@/lib/messages";
import { siteUrl } from "@/lib/site";
import { priceOf, STATUS_LABEL, type BookingStatus } from "@/lib/types";
import { whatsappLink } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

const SOURCE_LABEL = {
  route: "preço fixo da rota",
  hourly: "valor por hora",
  distance: "cálculo por distância",
  none: "sem preço configurado",
} as const;

const OK_MESSAGES: Record<string, string> = {
  confirmada: "Reserva confirmada. Agora avise o cliente pelo WhatsApp.",
  salvo: "Alterações salvas.",
  status: "Status atualizado.",
};

export default async function ReservaDetalhe(props: PageProps<"/admin/reservas/[id]">) {
  const { id } = await props.params;
  const sp = await props.searchParams;
  const { supabase } = await requireAdmin();

  const { data: row } = await supabase.from("bookings").select(BOOKING_SELECT).eq("id", id).maybeSingle();
  if (!row) notFound();
  const booking = normalizeBooking(row);

  const [{ data: driver }, { count: customerBookings }] = await Promise.all([
    supabase.from("drivers").select("name").eq("is_default", true).maybeSingle(),
    supabase.from("bookings").select("id", { count: "exact", head: true }).eq("customer_id", booking.customer_id),
  ]);

  const base = await siteUrl();
  const publicLink = `${base}/reserva/${booking.access_token}`;
  const price = priceOf(booking);
  const customerName = booking.customer?.name ?? "";
  const customerPhone = booking.customer?.phone ?? null;
  const confirmLink = whatsappLink(customerPhone, confirmationMessage(booking, customerName, driver?.name ?? "motorista", publicLink));
  const chatLink = whatsappLink(customerPhone, `Olá, ${customerName.split(" ")[0]}! Aqui é o ${driver?.name ?? "motorista"}, sobre a sua reserva ${booking.code}.`);

  const confirm = confirmBooking.bind(null, booking.id);
  const saveTerms = updateBookingTerms.bind(null, booking.id);
  const changeStatus = setBookingStatus.bind(null, booking.id);
  const markPaid = setPaymentStatus.bind(null, booking.id, booking.payment_status !== "paid");
  const okMessage = typeof sp.ok === "string" ? OK_MESSAGES[sp.ok] : undefined;

  return (
    <div className="space-y-5">
      <Link href="/admin" className="-ml-1 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft">
        <IconArrowLeft className="h-4 w-4" /> Voltar
      </Link>

      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted">
            {booking.service_name} · {booking.code}
          </p>
          <h1 className="text-2xl font-bold first-letter:uppercase">{formatLongDate(booking.pickup_at)}</h1>
          <p className="text-3xl font-bold tabular-nums">{formatTime(booking.pickup_at)}</p>
        </div>
        <StatusBadge status={booking.status} />
      </header>

      {okMessage && <p className="rounded-xl bg-ok-soft px-4 py-3 text-sm font-medium text-ok">{okMessage}</p>}

      {/* Ação principal conforme o status */}
      {booking.status === "requested" && (
        <Card className="border-warn/40 p-5">
          <h2 className="text-lg font-bold">Confirmar reserva</h2>
          <p className="mt-1 text-sm text-muted">
            {booking.estimated_price !== null
              ? `Valor estimado pelo app: ${formatMoney(booking.estimated_price)} (${SOURCE_LABEL[booking.price_source]}). Ajuste se precisar.`
              : "Sem preço configurado para este trajeto. Informe o valor que vai cobrar."}
          </p>
          <form action={confirm} className="mt-4 space-y-4">
            <div>
              <Label htmlFor="final_price">Valor da viagem (R$)</Label>
              <Input
                id="final_price"
                name="final_price"
                inputMode="decimal"
                placeholder="0,00"
                defaultValue={price !== null ? price.toFixed(2).replace(".", ",") : ""}
              />
            </div>
            <div>
              <Label htmlFor="driver_message" hint="opcional, aparece para o cliente">
                Recado
              </Label>
              <Textarea id="driver_message" name="driver_message" placeholder="Ex.: Estarei no desembarque com uma placa com seu nome." />
            </div>
            <SubmitButton full pendingText="Confirmando…">
              Confirmar reserva
            </SubmitButton>
          </form>
        </Card>
      )}

      {booking.status === "confirmed" && (
        <div className="space-y-3">
          <WhatsAppButton href={confirmLink}>Enviar confirmação ao cliente</WhatsAppButton>
          <form action={changeStatus}>
            <input type="hidden" name="status" value="completed" />
            <SubmitButton variant="secondary" full>
              Marcar como concluída
            </SubmitButton>
          </form>
        </div>
      )}

      <Card className="px-5">
        <dl className="divide-y divide-line">
          <InfoRow label="Cliente">
            <Link href={`/admin/clientes/${booking.customer_id}`} className="underline decoration-line underline-offset-4">
              {customerName}
            </Link>
            {customerBookings && customerBookings > 1 ? (
              <span className="block text-xs font-normal text-accent">Cliente recorrente · {customerBookings} reservas</span>
            ) : null}
          </InfoRow>
          <InfoRow label="Telefone">
            {customerPhone ? <a href={`tel:+${customerPhone}`}>{formatPhone(customerPhone)}</a> : "—"}
          </InfoRow>
          {booking.customer?.email && <InfoRow label="E-mail">{booking.customer.email}</InfoRow>}
          <InfoRow label={booking.service_billing === "hourly" ? "Início" : "Origem"}>{booking.origin}</InfoRow>
          {booking.destination && (
            <InfoRow label={booking.service_billing === "hourly" ? "Roteiro" : "Destino"}>{booking.destination}</InfoRow>
          )}
          {booking.hours && <InfoRow label="Duração">{formatHours(booking.hours)}</InfoRow>}
          <InfoRow label="Passageiros">{booking.passengers}</InfoRow>
          <InfoRow label="Serviço">{booking.service_name}</InfoRow>
          <InfoRow label="Valor">
            {formatMoney(price)}
            {booking.final_price === null && booking.estimated_price !== null && (
              <span className="block text-xs font-normal text-muted">estimado</span>
            )}
          </InfoRow>
          <InfoRow label="Pagamento">
            {booking.payment_status === "paid" ? (
              <span className="text-ok">Pago{booking.paid_at ? ` em ${formatDate(booking.paid_at)}` : ""}</span>
            ) : (
              "Pendente (Pix)"
            )}
          </InfoRow>
          {booking.notes && <InfoRow label="Observações">{booking.notes}</InfoRow>}
          {booking.driver_message && <InfoRow label="Seu recado">{booking.driver_message}</InfoRow>}
          {booking.cancel_reason && <InfoRow label="Motivo do cancelamento">{booking.cancel_reason}</InfoRow>}
          <InfoRow label="Solicitada em">
            {formatDate(booking.created_at)} {formatTime(booking.created_at)}
          </InfoRow>
        </dl>
      </Card>

      <div className="grid gap-3">
        <WhatsAppButton href={chatLink}>Falar com o cliente</WhatsAppButton>
        {booking.status !== "cancelled" && (
          <form action={markPaid}>
            <SubmitButton variant="secondary" full>
              {booking.payment_status === "paid" ? "Desfazer: marcar Pix como pendente" : "Marcar Pix como recebido"}
            </SubmitButton>
          </form>
        )}
        <CopyButton text={publicLink} label="Copiar link da reserva do cliente" />
      </div>

      {booking.status === "confirmed" && (
        <details className="rounded-2xl border border-line bg-card px-5 py-4">
          <summary className="cursor-pointer text-[15px] font-semibold">Editar valor ou recado</summary>
          <form action={saveTerms} className="mt-4 space-y-4">
            <div>
              <Label htmlFor="edit_price">Valor (R$)</Label>
              <Input
                id="edit_price"
                name="final_price"
                inputMode="decimal"
                defaultValue={price !== null ? price.toFixed(2).replace(".", ",") : ""}
              />
            </div>
            <div>
              <Label htmlFor="edit_message">Recado</Label>
              <Textarea id="edit_message" name="driver_message" defaultValue={booking.driver_message ?? ""} />
            </div>
            <SubmitButton variant="secondary" full>
              Salvar
            </SubmitButton>
          </form>
        </details>
      )}

      <details className="rounded-2xl border border-line bg-card px-5 py-4">
        <summary className="cursor-pointer text-[15px] font-semibold">Alterar status</summary>
        <form action={changeStatus} className="mt-4 space-y-4">
          <div>
            <Label htmlFor="status">Novo status</Label>
            <Select id="status" name="status" defaultValue={booking.status}>
              {(Object.keys(STATUS_LABEL) as BookingStatus[]).map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="cancel_reason" hint="se cancelar, aparece para o cliente">
              Motivo
            </Label>
            <Input id="cancel_reason" name="cancel_reason" maxLength={300} />
          </div>
          <SubmitButton variant="secondary" full>
            Salvar status
          </SubmitButton>
        </form>
      </details>
    </div>
  );
}
