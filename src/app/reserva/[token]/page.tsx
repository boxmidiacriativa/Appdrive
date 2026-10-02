import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { Logo } from "@/components/brand";
import { AutoRefresh } from "@/components/auto-refresh";
import { CopyButton } from "@/components/copy-button";
import { IconCalendar, IconCar, IconCheck, IconClock, IconFlag, IconHourglass, IconPin, IconUsers } from "@/components/icons";
import { RememberBooking } from "@/components/remember-booking";
import { buttonClass, Card, cx, WhatsAppButton } from "@/components/ui";
import { getSettings } from "@/lib/data";
import { formatHours, formatLongDate, formatMoney, formatPhone, formatTime } from "@/lib/format";
import { customerQuestionMessage } from "@/lib/messages";
import { buildPixPayload } from "@/lib/pix";
import { getBookingByToken, type PublicBooking } from "@/lib/public-booking";
import { priceOf } from "@/lib/types";
import { whatsappLink } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

// Link secreto: não indexar e não vazar o endereço para outros sites
export const metadata: Metadata = {
  title: "Sua reserva",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function BookingPage(props: PageProps<"/reserva/[token]">) {
  const { token } = await props.params;
  const [booking, settings] = await Promise.all([getBookingByToken(token), getSettings()]);
  if (!booking) notFound();

  const price = priceOf(booking);
  const driverName = booking.driver?.name ?? "O motorista";
  const contactLink = whatsappLink(booking.driver?.whatsapp, customerQuestionMessage(booking));

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-4 pt-6 pb-16">
      <RememberBooking
        token={token}
        code={booking.code}
        pickupAt={booking.pickup_at}
        service={booking.service_name}
      />
      {booking.status === "requested" && <AutoRefresh seconds={20} />}

      <Link href="/" aria-label="Início">
        <Logo name={settings.business_name} tagline={settings.tagline} size="sm" />
      </Link>

      <StatusHero booking={booking} driverName={driverName} />

      {booking.status === "confirmed" && booking.driver && (
        <Card className="mt-6 flex items-center gap-4 px-5 py-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ink text-lg font-bold text-white">
            {booking.driver.name.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Seu motorista</p>
            <p className="text-lg font-bold">{booking.driver.name}</p>
            {(booking.driver.vehicle || booking.driver.plate) && (
              <p className="flex items-center gap-1.5 text-sm text-muted">
                <IconCar className="h-4 w-4" />
                {[booking.driver.vehicle, booking.driver.plate].filter(Boolean).join(" · ")}
              </p>
            )}
            {booking.driver.whatsapp && <p className="text-sm text-muted">{formatPhone(booking.driver.whatsapp)}</p>}
          </div>
        </Card>
      )}

      {booking.driver_message && booking.status !== "cancelled" && (
        <div className="mt-4 rounded-2xl bg-accent-soft px-5 py-4 text-[15px] text-ink">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">Recado do motorista</p>
          <p className="mt-1 whitespace-pre-line">{booking.driver_message}</p>
        </div>
      )}

      <Card className="mt-4 overflow-hidden">
        <dl className="divide-y divide-line px-5">
          <Row icon={<IconCalendar className="h-4 w-4" />} label="Data" value={formatLongDate(booking.pickup_at)} />
          <Row icon={<IconClock className="h-4 w-4" />} label="Horário" value={formatTime(booking.pickup_at)} />
          <Row
            icon={<IconPin className="h-4 w-4" />}
            label={booking.service_billing === "hourly" ? "Início" : "Origem"}
            value={booking.origin}
          />
          {booking.destination && (
            <Row
              icon={<IconFlag className="h-4 w-4" />}
              label={booking.service_billing === "hourly" ? "Roteiro" : "Destino"}
              value={booking.destination}
            />
          )}
          {booking.service_billing === "hourly" && booking.hours && (
            <Row icon={<IconHourglass className="h-4 w-4" />} label="Duração" value={formatHours(booking.hours)} />
          )}
          <Row icon={<IconUsers className="h-4 w-4" />} label="Passageiros" value={String(booking.passengers)} />
        </dl>
        <div className="flex items-center justify-between border-t border-line bg-paper/60 px-5 py-4">
          <div>
            <p className="text-sm text-muted">{booking.service_name}</p>
            <p className="text-xs text-muted">Reserva {booking.code}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted">
              {booking.final_price !== null ? "Valor" : price !== null ? "Valor estimado" : "Valor"}
            </p>
            <p className="text-xl font-bold">{price !== null ? formatMoney(price) : "A confirmar"}</p>
          </div>
        </div>
      </Card>

      {booking.notes && (
        <p className="mt-3 px-1 text-sm text-muted">
          <span className="font-semibold">Suas observações:</span> {booking.notes}
        </p>
      )}

      {booking.status === "confirmed" && <PaymentBlock booking={booking} price={price} />}

      <div className="mt-6 space-y-3">
        <WhatsAppButton href={contactLink}>Falar pelo WhatsApp</WhatsAppButton>
        {(booking.status === "completed" || booking.status === "cancelled") && (
          <Link href="/" className={buttonClass("secondary", true)}>
            Reservar de novo
          </Link>
        )}
      </div>
    </main>
  );
}

function StatusHero({ booking, driverName }: { booking: PublicBooking; driverName: string }) {
  const first = booking.customerName.split(" ")[0];
  const content = {
    requested: {
      tone: "bg-warn-soft text-warn",
      title: "Solicitação enviada",
      text: `${first ? `${first}, sua` : "Sua"} solicitação chegou. ${driverName} vai confirmar a reserva em breve — esta página atualiza sozinha e você também pode chamar no WhatsApp.`,
    },
    confirmed: {
      tone: "bg-ok-soft text-ok",
      title: "Reserva confirmada",
      text: `Tudo certo${first ? `, ${first}` : ""}! ${driverName} estará no local no horário combinado.`,
    },
    completed: {
      tone: "bg-slate-soft text-ink-soft",
      title: "Viagem concluída",
      text: "Obrigado por ir de Gui. Quando precisar, é só reservar de novo.",
    },
    cancelled: {
      tone: "bg-danger-soft text-danger",
      title: "Reserva cancelada",
      text: booking.cancel_reason ? `Motivo: ${booking.cancel_reason}` : "Esta reserva foi cancelada. Fale com o motorista se tiver dúvidas.",
    },
  }[booking.status];

  return (
    <section className="mt-5">
      <span className={cx("inline-flex h-12 w-12 items-center justify-center rounded-full", content.tone)}>
        {booking.status === "requested" ? <IconClock className="h-6 w-6" /> : <IconCheck className="h-6 w-6" />}
      </span>
      <h1 className="mt-4 text-[28px] leading-tight font-bold">{content.title}</h1>
      <p className="mt-2 text-[15px] leading-relaxed text-muted">{content.text}</p>
    </section>
  );
}

async function PaymentBlock({ booking, price }: { booking: PublicBooking; price: number | null }) {
  if (booking.payment_status === "paid") {
    return (
      <div className="mt-4 flex items-center gap-3 rounded-2xl bg-ok-soft px-5 py-4 text-ok">
        <IconCheck className="h-5 w-5" />
        <p className="text-[15px] font-semibold">Pagamento recebido. Obrigado!</p>
      </div>
    );
  }

  const d = booking.driver;
  if (!d?.pix_key || !d.pix_key_type || price === null) return null;

  const payload = buildPixPayload({
    keyType: d.pix_key_type,
    key: d.pix_key,
    receiverName: d.pix_receiver_name || d.name,
    city: d.pix_city || "BRASIL",
    amount: price,
    txid: booking.code,
  });
  const qr = await QRCode.toDataURL(payload, { margin: 1, width: 480, color: { dark: "#12192b", light: "#ffffff" } });

  return (
    <Card className="mt-4 px-5 py-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">Pagamento por Pix</p>
      <p className="mt-1 text-[15px]">
        {formatMoney(price)} para <span className="font-semibold">{d.pix_receiver_name || d.name}</span>
      </p>
      <div className="mt-4 flex justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qr} alt="QR Code Pix" width={208} height={208} className="rounded-xl border border-line" />
      </div>
      <p className="mt-4 text-sm text-muted">Ou copie o código e cole no app do seu banco:</p>
      <p className="mt-2 rounded-xl bg-paper px-3 py-2 font-mono text-[11px] leading-relaxed break-all text-ink-soft">{payload}</p>
      <div className="mt-3">
        <CopyButton text={payload} />
      </div>
      <p className="mt-3 text-xs text-muted">Depois de pagar, envie o comprovante pelo WhatsApp.</p>
    </Card>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <span className="mt-0.5 text-accent">{icon}</span>
      <dt className="w-24 shrink-0 text-sm text-muted">{label}</dt>
      <dd className="flex-1 text-[15px] font-medium break-words">{value}</dd>
    </div>
  );
}
