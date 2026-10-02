import { createRoutePrice, deleteRoutePrice, savePlace, updateService } from "@/app/admin/actions";
import { SubmitButton } from "@/components/admin/submit-button";
import { Card, EmptyState, Input, Label, Select } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { normalizeRoutePrice, normalizeService } from "@/lib/data";
import { formatMoney } from "@/lib/format";
import { mapsEnabled } from "@/lib/maps";
import type { Place, Service } from "@/lib/types";

export const dynamic = "force-dynamic";

const money = (v: number | null) => (v === null ? "" : v.toFixed(2).replace(".", ","));

export default async function PrecosPage(props: PageProps<"/admin/precos">) {
  const sp = await props.searchParams;
  const { supabase } = await requireAdmin();
  const [{ data: serviceRows }, { data: places }, { data: routeRows }] = await Promise.all([
    supabase.from("services").select("*").order("sort_order"),
    supabase.from("places").select("*").order("sort_order").order("name"),
    supabase.from("route_prices").select("*").order("created_at"),
  ]);
  const services = (serviceRows ?? []).map(normalizeService);
  const routes = (routeRows ?? []).map(normalizeRoutePrice);
  const placeName = (id: string) => places?.find((p) => p.id === id)?.name ?? "—";
  const serviceName = (id: string | null) => (id ? services.find((s) => s.id === id)?.name : "Qualquer serviço");
  const activePlaces = (places ?? []).filter((p) => p.active);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold">Preços</h1>
        <p className="mt-1 text-sm text-muted">
          O valor é sempre previsível. Ordem de cálculo: preço fixo da rota → valor por hora → valor por km/minuto. Sem preço, o
          cliente vê &quot;a confirmar&quot; e você define ao confirmar.
        </p>
        {sp.ok && <p className="mt-3 rounded-xl bg-ok-soft px-4 py-3 text-sm text-ok">Salvo.</p>}
        {sp.erro && (
          <p className="mt-3 rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">
            Confira a rota: origem e destino diferentes e um valor válido.
          </p>
        )}
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">Serviços</h2>
        {!mapsEnabled() && (
          <p className="rounded-xl bg-warn-soft px-4 py-3 text-sm text-warn">
            Mapas ainda não estão ligados: os valores por km e por minuto ficam guardados e passam a valer quando a distância for
            calculada automaticamente. Por enquanto use preço por rota ou por hora.
          </p>
        )}
        {services.map((s) => (
          <ServiceForm key={s.id} service={s} />
        ))}
      </section>

      <section id="locais" className="space-y-3">
        <h2 className="text-lg font-bold">Locais frequentes</h2>
        <p className="text-sm text-muted">Aeroporto, rodoviária, hotéis e pousadas. Aparecem como sugestão para o cliente e servem para preços fixos.</p>
        {places?.map((p) => (
          <PlaceForm key={p.id} place={p} />
        ))}
        <Card className="p-4">
          <form action={savePlace.bind(null, null)} className="space-y-3">
            <p className="text-sm font-semibold">Novo local</p>
            <Input name="name" placeholder="Nome (ex.: Aeroporto de Navegantes)" required />
            <Input name="address" placeholder="Endereço ou referência (opcional)" />
            <SubmitButton variant="secondary" full>
              Adicionar local
            </SubmitButton>
          </form>
        </Card>
      </section>

      <section id="rotas" className="space-y-3">
        <h2 className="text-lg font-bold">Preço fixo por rota</h2>
        {routes.length ? (
          <ul className="divide-y divide-line rounded-2xl border border-line bg-card">
            {routes.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="min-w-0 text-sm">
                  <span className="block font-semibold">
                    {placeName(r.origin_place_id)} {r.both_directions ? "⇄" : "→"} {placeName(r.destination_place_id)}
                  </span>
                  <span className="text-muted">
                    {serviceName(r.service_id)} · {formatMoney(r.price)}
                  </span>
                </span>
                <form action={deleteRoutePrice.bind(null, r.id)}>
                  <SubmitButton variant="ghost" className="min-h-9 px-3 text-sm text-danger" confirmText="Remover esta rota?">
                    Remover
                  </SubmitButton>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState>Nenhuma rota com preço fixo.</EmptyState>
        )}
        {activePlaces.length >= 2 ? (
          <Card className="p-4">
            <form action={createRoutePrice} className="space-y-3">
              <p className="text-sm font-semibold">Nova rota</p>
              <PlaceSelect name="origin_place_id" label="De" places={activePlaces} />
              <PlaceSelect name="destination_place_id" label="Para" places={activePlaces} />
              <div>
                <Label htmlFor="route-service">Serviço</Label>
                <Select id="route-service" name="service_id" defaultValue="">
                  <option value="">Qualquer serviço de trajeto</option>
                  {services
                    .filter((s) => s.billing === "trip")
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="route-price">Valor (R$)</Label>
                <Input id="route-price" name="price" inputMode="decimal" placeholder="0,00" required />
              </div>
              <label className="flex items-center gap-3 text-sm">
                <input type="checkbox" name="both_directions" defaultChecked className="h-5 w-5 accent-[var(--ink)]" />
                Mesmo valor na volta
              </label>
              <SubmitButton variant="secondary" full>
                Adicionar rota
              </SubmitButton>
            </form>
          </Card>
        ) : (
          <p className="text-sm text-muted">Cadastre pelo menos dois locais frequentes para criar uma rota.</p>
        )}
      </section>
    </div>
  );
}

function ServiceForm({ service: s }: { service: Service }) {
  const hourly = s.billing === "hourly";
  return (
    <details className="rounded-2xl border border-line bg-card px-4 py-3">
      <summary className="flex cursor-pointer items-center justify-between gap-3 py-1">
        <span>
          <span className="block font-semibold">{s.name}</span>
          <span className="text-sm text-muted">
            {!s.active
              ? "Desativado"
              : hourly
                ? s.price_per_hour
                  ? `${formatMoney(s.price_per_hour)}/hora`
                  : "Sem valor por hora"
                : s.price_per_km || s.price_per_minute
                  ? `${formatMoney(s.price_per_km ?? 0)}/km`
                  : "Preço por rota ou a confirmar"}
          </span>
        </span>
        <span className="text-sm font-semibold text-accent">Editar</span>
      </summary>
      <form action={updateService.bind(null, s.id)} className="mt-3 space-y-3 border-t border-line pt-4">
        <div>
          <Label htmlFor={`name-${s.id}`}>Nome</Label>
          <Input id={`name-${s.id}`} name="name" defaultValue={s.name} required />
        </div>
        <div>
          <Label htmlFor={`desc-${s.id}`}>Descrição</Label>
          <Input id={`desc-${s.id}`} name="description" defaultValue={s.description ?? ""} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <MoneyField id={`base-${s.id}`} name="base_fee" label="Tarifa base" value={s.base_fee} />
          <MoneyField id={`min-${s.id}`} name="minimum_price" label="Valor mínimo" value={s.minimum_price} />
          {hourly ? (
            <>
              <MoneyField id={`hour-${s.id}`} name="price_per_hour" label="Valor por hora" value={s.price_per_hour} />
              <div>
                <Label htmlFor={`minh-${s.id}`}>Mínimo de horas</Label>
                <Input id={`minh-${s.id}`} name="min_hours" inputMode="decimal" defaultValue={money(s.min_hours)} />
              </div>
            </>
          ) : (
            <>
              <MoneyField id={`km-${s.id}`} name="price_per_km" label="Valor por km" value={s.price_per_km} />
              <MoneyField id={`minute-${s.id}`} name="price_per_minute" label="Valor por minuto" value={s.price_per_minute} />
            </>
          )}
        </div>
        <label className="flex items-center gap-3 text-sm">
          <input type="checkbox" name="active" defaultChecked={s.active} className="h-5 w-5 accent-[var(--ink)]" />
          Disponível para os clientes
        </label>
        <SubmitButton variant="secondary" full>
          Salvar serviço
        </SubmitButton>
      </form>
    </details>
  );
}

function MoneyField({ id, name, label, value }: { id: string; name: string; label: string; value: number | null }) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={name} inputMode="decimal" placeholder="—" defaultValue={money(value)} />
    </div>
  );
}

function PlaceForm({ place }: { place: Place }) {
  return (
    <details className="rounded-2xl border border-line bg-card px-4 py-3">
      <summary className="flex cursor-pointer items-center justify-between gap-3 py-1">
        <span className="min-w-0">
          <span className="block truncate font-semibold">{place.name}</span>
          <span className="text-sm text-muted">{place.active ? place.address || "Sem endereço" : "Desativado"}</span>
        </span>
        <span className="text-sm font-semibold text-accent">Editar</span>
      </summary>
      <form action={savePlace.bind(null, place.id)} className="mt-3 space-y-3 border-t border-line pt-4">
        <Input name="name" defaultValue={place.name} required aria-label="Nome do local" />
        <Input name="address" defaultValue={place.address ?? ""} placeholder="Endereço" aria-label="Endereço" />
        <label className="flex items-center gap-3 text-sm">
          <input type="checkbox" name="active" defaultChecked={place.active} className="h-5 w-5 accent-[var(--ink)]" />
          Ativo
        </label>
        <SubmitButton variant="secondary" full>
          Salvar local
        </SubmitButton>
      </form>
    </details>
  );
}

function PlaceSelect({ name, label, places }: { name: string; label: string; places: Place[] }) {
  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <Select id={name} name={name} required defaultValue="">
        <option value="" disabled>
          Escolha um local
        </option>
        {places.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </Select>
    </div>
  );
}
