"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useState, useTransition, type ReactNode } from "react";
import { createBooking, quoteBooking, type QuoteResult } from "@/app/actions/booking";
import { formatHours, formatLongDate, formatMoney } from "@/lib/format";
import { loadContact, rememberBooking, saveContact } from "@/lib/local";
import type { PublicService } from "@/lib/types";
import {
  IconArrowLeft,
  IconCalendar,
  IconCar,
  IconClock,
  IconFlag,
  IconHourglass,
  IconPin,
  IconPlane,
  IconRoute,
  IconUsers,
} from "./icons";
import { Button, Card, cx, FieldError, Input, Label, Select, Textarea } from "./ui";

type PlaceOption = { id: string; name: string; address: string | null };
type Errors = Record<string, string[] | undefined>;

const serviceIcon = (slug: string) => {
  if (slug === "transfer") return IconPlane;
  if (slug === "viagem") return IconRoute;
  if (slug === "por-periodo") return IconHourglass;
  return IconCar;
};

const HOUR_OPTIONS = [1, 2, 3, 4, 5, 6, 8, 10, 12];

export function BookingFlow({ services, places, today }: { services: PublicService[]; places: PlaceOption[]; today: string }) {
  const router = useRouter();
  const [step, setStep] = useState<"trip" | "summary">("trip");
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Errors>({});
  const [message, setMessage] = useState<string | null>(null);

  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [passengers, setPassengers] = useState(1);
  const [hours, setHours] = useState(3);

  const [quote, setQuote] = useState<Extract<QuoteResult, { ok: true }> | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [website, setWebsite] = useState("");
  const [returning, setReturning] = useState(false);

  useEffect(() => {
    const saved = loadContact();
    if (saved) {
      // Preenche os dados de quem já reservou neste aparelho
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(saved.name);
      setPhone(saved.phone);
      setEmail(saved.email ?? "");
      setReturning(true);
    }
  }, []);

  const service = services.find((s) => s.id === serviceId);
  const hourly = service?.billing === "hourly";
  const placeId = (value: string) => places.find((p) => p.name === value.trim())?.id ?? null;

  const trip = () => ({
    serviceId,
    origin,
    originPlaceId: placeId(origin),
    destination: destination || null,
    destinationPlaceId: placeId(destination),
    date,
    time,
    passengers,
    hours: hourly ? hours : null,
  });

  function goToSummary(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const result = await quoteBooking(trip());
      if (!result.ok) {
        setErrors(result.errors);
        setMessage(result.message ?? null);
        return;
      }
      setErrors({});
      setQuote(result);
      setStep("summary");
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const result = await createBooking(trip(), { name, phone, email, notes, website });
      if (!result.ok) {
        setErrors(result.errors);
        setMessage(result.message ?? "Confira os campos destacados.");
        const tripFields = ["serviceId", "origin", "destination", "date", "time", "passengers", "hours"];
        if (Object.keys(result.errors).some((k) => tripFields.includes(k))) setStep("trip");
        return;
      }
      saveContact({ name, phone, email });
      rememberBooking({
        token: result.token,
        code: result.code,
        pickupAt: `${date}T${time}:00-03:00`,
        service: service?.name ?? "",
      });
      router.push(`/reserva/${result.token}`);
    });
  }

  if (step === "summary" && quote && service) {
    return (
      <form onSubmit={submit} className="space-y-5">
        <button
          type="button"
          onClick={() => setStep("trip")}
          className="-ml-1 inline-flex items-center gap-1.5 py-1 text-sm font-semibold text-ink-soft"
        >
          <IconArrowLeft className="h-4 w-4" /> Editar viagem
        </button>

        <Card className="overflow-hidden">
          <div className="border-b border-line px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Resumo</p>
            <p className="mt-1 text-lg font-bold">{service.name}</p>
          </div>
          <dl className="divide-y divide-line px-5">
            <SummaryRow icon={<IconPin className="h-4 w-4" />} label={hourly ? "Início" : "Origem"} value={origin} />
            {(destination || !hourly) && (
              <SummaryRow icon={<IconFlag className="h-4 w-4" />} label={hourly ? "Roteiro" : "Destino"} value={destination} />
            )}
            <SummaryRow
              icon={<IconCalendar className="h-4 w-4" />}
              label="Data"
              value={formatLongDate(`${date}T12:00:00-03:00`)}
            />
            <SummaryRow icon={<IconClock className="h-4 w-4" />} label="Horário" value={time} />
            {hourly && <SummaryRow icon={<IconHourglass className="h-4 w-4" />} label="Duração" value={formatHours(hours)} />}
            <SummaryRow icon={<IconUsers className="h-4 w-4" />} label="Passageiros" value={String(passengers)} />
          </dl>
          <div className="bg-ink px-5 py-5 text-white">
            {quote.price !== null ? (
              <>
                <p className="text-sm text-white/70">Valor estimado da viagem</p>
                <p className="mt-1 text-3xl font-bold tracking-tight">{formatMoney(quote.price)}</p>
                {quote.billedHours && quote.billedHours > hours && (
                  <p className="mt-1 text-xs text-white/70">Inclui o mínimo de {formatHours(quote.billedHours)}.</p>
                )}
              </>
            ) : (
              <>
                <p className="text-sm text-white/70">Valor</p>
                <p className="mt-1 text-xl font-bold">A confirmar pelo motorista</p>
                <p className="mt-1 text-xs text-white/70">Você recebe o valor junto com a confirmação, antes de pagar.</p>
              </>
            )}
          </div>
        </Card>

        <div className="space-y-4">
          <h2 className="text-base font-bold">{returning ? `Que bom te ver de novo${name ? `, ${name.split(" ")[0]}` : ""}!` : "Seus dados"}</h2>
          <div>
            <Label htmlFor="name">Nome</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
            <FieldError>{errors.name?.[0]}</FieldError>
          </div>
          <div>
            <Label htmlFor="phone">WhatsApp</Label>
            <Input
              id="phone"
              type="tel"
              inputMode="tel"
              placeholder="(47) 99999-9999"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
              required
            />
            <FieldError>{errors.phone?.[0]}</FieldError>
          </div>
          <div>
            <Label htmlFor="email" hint="opcional">
              E-mail
            </Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            <FieldError>{errors.email?.[0]}</FieldError>
          </div>
          <div>
            <Label htmlFor="notes" hint="opcional">
              Observações
            </Label>
            <Textarea
              id="notes"
              placeholder="Número do voo, bagagens, cadeirinha, ponto de encontro…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={500}
            />
          </div>
          <div className="hidden" aria-hidden="true">
            <label>
              Site
              <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
            </label>
          </div>
        </div>

        {message && <p className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">{message}</p>}

        <div className="space-y-3">
          <Button type="submit" full disabled={pending}>
            {pending ? "Enviando…" : "Solicitar reserva"}
          </Button>
          <p className="text-center text-xs leading-relaxed text-muted">
            Nada é cobrado agora. O motorista confirma a reserva e o pagamento é feito por Pix.
          </p>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={goToSummary} className="space-y-5">
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Serviço</legend>
        <div className="grid grid-cols-3 gap-2">
          {services.map((s) => {
            const Icon = serviceIcon(s.slug);
            const active = s.id === serviceId;
            return (
              <button
                type="button"
                key={s.id}
                onClick={() => {
                  setServiceId(s.id);
                  if (s.billing === "hourly" && s.min_hours && hours < s.min_hours) setHours(Math.ceil(s.min_hours));
                }}
                aria-pressed={active}
                className={cx(
                  "flex min-h-[88px] flex-col items-center justify-center gap-1.5 rounded-2xl border px-2 py-3 text-center text-[13px] font-semibold leading-tight transition-colors",
                  active ? "border-ink bg-ink text-white" : "border-line bg-card text-ink hover:border-ink/30",
                )}
              >
                <Icon className={cx("h-6 w-6", active ? "text-accent-soft" : "text-accent")} />
                {s.name}
              </button>
            );
          })}
        </div>
        {service?.description && <p className="mt-2 text-sm text-muted">{service.description}</p>}
        <FieldError>{errors.serviceId?.[0]}</FieldError>
      </fieldset>

      <PlaceField
        label={hourly ? "Local de início" : "Local de origem"}
        name="origin"
        value={origin}
        onChange={setOrigin}
        places={places}
        placeholder="Endereço, hotel, pousada, aeroporto…"
        error={errors.origin?.[0]}
        required
      />

      <PlaceField
        label={hourly ? "Roteiro ou destinos" : "Destino"}
        hint={hourly ? "opcional" : undefined}
        name="destination"
        value={destination}
        onChange={setDestination}
        places={places}
        placeholder={hourly ? "Ex.: reunião no centro e volta ao hotel" : "Para onde vamos?"}
        error={errors.destination?.[0]}
        required={!hourly}
      />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="date">Data</Label>
          <Input id="date" type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} required />
          <FieldError>{errors.date?.[0]}</FieldError>
        </div>
        <div>
          <Label htmlFor="time">Horário</Label>
          <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
          <FieldError>{errors.time?.[0]}</FieldError>
        </div>
      </div>

      <div className={cx("grid gap-3", hourly ? "grid-cols-2" : "grid-cols-1")}>
        <div>
          <Label>Passageiros</Label>
          <div className="flex h-12 items-center justify-between rounded-xl border border-line bg-card px-1.5">
            <StepButton label="Menos um passageiro" onClick={() => setPassengers((p) => Math.max(1, p - 1))}>
              −
            </StepButton>
            <span className="text-base font-semibold tabular-nums" aria-live="polite">
              {passengers}
            </span>
            <StepButton label="Mais um passageiro" onClick={() => setPassengers((p) => Math.min(20, p + 1))}>
              +
            </StepButton>
          </div>
          <FieldError>{errors.passengers?.[0]}</FieldError>
        </div>
        {hourly && (
          <div>
            <Label htmlFor="hours">Duração</Label>
            <Select id="hours" value={hours} onChange={(e) => setHours(Number(e.target.value))}>
              {HOUR_OPTIONS.filter((h) => !service?.min_hours || h >= service.min_hours).map((h) => (
                <option key={h} value={h}>
                  {formatHours(h)}
                </option>
              ))}
            </Select>
            <FieldError>{errors.hours?.[0]}</FieldError>
          </div>
        )}
      </div>

      {message && <p className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">{message}</p>}

      <Button type="submit" full disabled={pending || !serviceId}>
        {pending ? "Calculando…" : "Ver valor e continuar"}
      </Button>
    </form>
  );
}

function SummaryRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <span className="mt-0.5 text-accent">{icon}</span>
      <dt className="w-24 shrink-0 text-sm text-muted">{label}</dt>
      <dd className="flex-1 text-[15px] font-medium break-words">{value || "—"}</dd>
    </div>
  );
}

function StepButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-lg text-xl font-semibold text-ink-soft hover:bg-slate-soft"
    >
      {children}
    </button>
  );
}

function PlaceField({
  label,
  hint,
  name,
  value,
  onChange,
  places,
  placeholder,
  error,
  required,
}: {
  label: string;
  hint?: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  places: PlaceOption[];
  placeholder: string;
  error?: string;
  required?: boolean;
}) {
  const listId = useId();
  const inputId = `${name}-input`;
  const suggestions = places.slice(0, 4);
  return (
    <div>
      <Label htmlFor={inputId} hint={hint}>
        {label}
      </Label>
      <Input
        id={inputId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        list={places.length ? listId : undefined}
        placeholder={placeholder}
        autoComplete="off"
        required={required}
        maxLength={200}
      />
      {places.length > 0 && (
        <datalist id={listId}>
          {places.map((p) => (
            <option key={p.id} value={p.name}>
              {p.address ?? ""}
            </option>
          ))}
        </datalist>
      )}
      {!value && suggestions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {suggestions.map((p) => (
            <button
              type="button"
              key={p.id}
              onClick={() => onChange(p.name)}
              className="rounded-full border border-line bg-card px-3 py-1.5 text-xs font-medium text-ink-soft hover:border-ink/30"
            >
              {p.name}
            </button>
          ))}
        </div>
      )}
      <FieldError>{error}</FieldError>
    </div>
  );
}
