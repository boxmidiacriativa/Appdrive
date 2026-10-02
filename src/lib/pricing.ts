// Cálculo de preço previsível (sem tarifa dinâmica).
// Função pura: recebe as regras e devolve o valor estimado e de onde ele veio.
// Ordem de prioridade para serviços de trajeto:
//   1. preço fixo da rota (dois locais frequentes)
//   2. tarifa base + km + minuto, quando há estimativa de rota (mapas)
//   3. sem preço -> "a confirmar pelo motorista"
// Serviços por período: tarifa base + horas x valor/hora (respeitando mínimo de horas).

export type ServiceBilling = "trip" | "hourly";
export type PriceSource = "route" | "distance" | "hourly" | "none";

export type ServicePricing = {
  id: string;
  billing: ServiceBilling;
  base_fee: number | null;
  price_per_km: number | null;
  price_per_minute: number | null;
  price_per_hour: number | null;
  min_hours: number | null;
  minimum_price: number | null;
};

export type RoutePrice = {
  service_id: string | null;
  origin_place_id: string;
  destination_place_id: string;
  price: number;
  both_directions: boolean;
  active: boolean;
};

export type RouteEstimate = { distanceKm: number; durationMin: number };

export type PriceInput = {
  service: ServicePricing;
  originPlaceId?: string | null;
  destinationPlaceId?: string | null;
  hours?: number | null;
  routePrices: RoutePrice[];
  estimate?: RouteEstimate | null;
};

export type PriceResult = {
  price: number | null;
  source: PriceSource;
  billedHours?: number;
};

const n = (v: number | null | undefined) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
const has = (v: number | null | undefined) => typeof v === "number" && Number.isFinite(v) && v > 0;
const round2 = (v: number) => Math.round(v * 100) / 100;

function withMinimum(value: number, service: ServicePricing) {
  return round2(Math.max(value, n(service.minimum_price)));
}

export function findRoutePrice(
  routePrices: RoutePrice[],
  serviceId: string,
  originPlaceId: string,
  destinationPlaceId: string,
): RoutePrice | undefined {
  const matches = (r: RoutePrice) =>
    r.active &&
    ((r.origin_place_id === originPlaceId && r.destination_place_id === destinationPlaceId) ||
      (r.both_directions &&
        r.origin_place_id === destinationPlaceId &&
        r.destination_place_id === originPlaceId));

  // Preço específico do serviço tem prioridade sobre o genérico (service_id nulo)
  return (
    routePrices.find((r) => r.service_id === serviceId && matches(r)) ??
    routePrices.find((r) => r.service_id === null && matches(r))
  );
}

export function calculatePrice(input: PriceInput): PriceResult {
  const { service } = input;

  if (service.billing === "hourly") {
    if (!has(service.price_per_hour) || !has(input.hours ?? null)) {
      return { price: null, source: "none" };
    }
    const billedHours = Math.max(n(input.hours), n(service.min_hours));
    const value = n(service.base_fee) + billedHours * n(service.price_per_hour);
    return { price: withMinimum(value, service), source: "hourly", billedHours };
  }

  if (input.originPlaceId && input.destinationPlaceId) {
    const route = findRoutePrice(
      input.routePrices,
      service.id,
      input.originPlaceId,
      input.destinationPlaceId,
    );
    if (route) return { price: round2(route.price), source: "route" };
  }

  const estimate = input.estimate;
  if (estimate && (has(service.price_per_km) || has(service.price_per_minute))) {
    const value =
      n(service.base_fee) +
      estimate.distanceKm * n(service.price_per_km) +
      estimate.durationMin * n(service.price_per_minute);
    return { price: withMinimum(value, service), source: "distance" };
  }

  return { price: null, source: "none" };
}
