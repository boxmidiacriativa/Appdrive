"use client";

import { startTransition, useActionState, useId, useState } from "react";
import { createBookingByAdmin } from "@/app/admin/actions";
import { Button, Card, Input, Label, Select, Textarea } from "../ui";

type ServiceOption = { id: string; name: string; billing: "trip" | "hourly" };

export function NewBookingForm({
  services,
  places,
  today,
}: {
  services: ServiceOption[];
  places: { id: string; name: string }[];
  today: string;
}) {
  const [state, action, pending] = useActionState(createBookingByAdmin, undefined);
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const hourly = services.find((s) => s.id === serviceId)?.billing === "hourly";
  const listId = useId();

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        // Envio manual: assim o formulário não é limpo quando há erro de validação
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => action(data));
      }}
    >
      <Card className="space-y-4 p-5">
        <h2 className="text-base font-bold">Cliente</h2>
        <div>
          <Label htmlFor="name">Nome</Label>
          <Input id="name" name="name" required maxLength={80} />
        </div>
        <div>
          <Label htmlFor="phone" hint="se já for cliente, é reconhecido">
            WhatsApp
          </Label>
          <Input id="phone" name="phone" type="tel" inputMode="tel" placeholder="(47) 99999-9999" required />
        </div>
        <div>
          <Label htmlFor="email" hint="opcional">
            E-mail
          </Label>
          <Input id="email" name="email" type="email" />
        </div>
      </Card>

      <Card className="space-y-4 p-5">
        <h2 className="text-base font-bold">Viagem</h2>
        <div>
          <Label htmlFor="service_id">Serviço</Label>
          <Select id="service_id" name="service_id" value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </div>
        <datalist id={listId}>
          {places.map((p) => (
            <option key={p.id} value={p.name} />
          ))}
        </datalist>
        <div>
          <Label htmlFor="origin">{hourly ? "Local de início" : "Origem"}</Label>
          <Input id="origin" name="origin" list={listId} autoComplete="off" required maxLength={200} />
        </div>
        <div>
          <Label htmlFor="destination" hint={hourly ? "opcional" : undefined}>
            {hourly ? "Roteiro ou destinos" : "Destino"}
          </Label>
          <Input id="destination" name="destination" list={listId} autoComplete="off" required={!hourly} maxLength={200} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="date">Data</Label>
            <Input id="date" name="date" type="date" defaultValue={today} required />
          </div>
          <div>
            <Label htmlFor="time">Horário</Label>
            <Input id="time" name="time" type="time" required />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="passengers">Passageiros</Label>
            <Input id="passengers" name="passengers" type="number" min={1} max={50} defaultValue={1} required />
          </div>
          {hourly && (
            <div>
              <Label htmlFor="hours">Horas</Label>
              <Input id="hours" name="hours" inputMode="decimal" placeholder="3" required />
            </div>
          )}
        </div>
        <div>
          <Label htmlFor="notes" hint="opcional">
            Observações
          </Label>
          <Textarea id="notes" name="notes" placeholder="Voo, bagagens, cadeirinha…" />
        </div>
      </Card>

      <Card className="space-y-4 p-5">
        <h2 className="text-base font-bold">Valor e confirmação</h2>
        <div>
          <Label htmlFor="final_price" hint="vazio = usa sua tabela de preços">
            Valor (R$)
          </Label>
          <Input id="final_price" name="final_price" inputMode="decimal" placeholder="0,00" />
        </div>
        <div>
          <Label htmlFor="driver_message" hint="opcional, aparece para o cliente">
            Recado
          </Label>
          <Textarea id="driver_message" name="driver_message" />
        </div>
        <label className="flex items-center gap-3 text-sm">
          <input type="checkbox" name="confirmed" defaultChecked className="h-5 w-5 accent-[var(--ink)]" />
          Já combinado com o cliente (salvar como confirmada)
        </label>
      </Card>

      {state?.error && <p className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">{state.error}</p>}

      <Button type="submit" full disabled={pending}>
        {pending ? "Salvando…" : "Salvar reserva"}
      </Button>
    </form>
  );
}
