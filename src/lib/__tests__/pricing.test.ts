import { describe, expect, it } from "vitest";
import { calculatePrice, type RoutePrice, type ServicePricing } from "../pricing";

const empty: Omit<ServicePricing, "id" | "billing"> = {
  base_fee: null,
  price_per_km: null,
  price_per_minute: null,
  price_per_hour: null,
  min_hours: null,
  minimum_price: null,
};
const transfer: ServicePricing = { id: "s1", billing: "trip", ...empty };
const periodo: ServicePricing = { id: "s3", billing: "hourly", ...empty };

const route = (over: Partial<RoutePrice> = {}): RoutePrice => ({
  service_id: null,
  origin_place_id: "aeroporto",
  destination_place_id: "pousada",
  price: 180,
  both_directions: true,
  active: true,
  ...over,
});

describe("calculatePrice", () => {
  it("sem nenhum preço configurado fica a confirmar", () => {
    expect(calculatePrice({ service: transfer, routePrices: [] })).toEqual({ price: null, source: "none" });
    expect(calculatePrice({ service: periodo, routePrices: [], hours: 3 })).toEqual({ price: null, source: "none" });
  });

  it("usa preço fixo da rota nos dois sentidos", () => {
    const routes = [route()];
    expect(
      calculatePrice({ service: transfer, routePrices: routes, originPlaceId: "pousada", destinationPlaceId: "aeroporto" }),
    ).toEqual({ price: 180, source: "route" });
  });

  it("respeita rota de mão única e rota inativa", () => {
    const routes = [route({ both_directions: false }), route({ origin_place_id: "pousada", destination_place_id: "aeroporto", active: false })];
    expect(
      calculatePrice({ service: transfer, routePrices: routes, originPlaceId: "pousada", destinationPlaceId: "aeroporto" }).source,
    ).toBe("none");
  });

  it("prefere a rota específica do serviço", () => {
    const routes = [route({ price: 100 }), route({ service_id: "s1", price: 150 })];
    expect(
      calculatePrice({ service: transfer, routePrices: routes, originPlaceId: "aeroporto", destinationPlaceId: "pousada" }).price,
    ).toBe(150);
  });

  it("calcula por km e minuto quando há estimativa, com mínimo", () => {
    const s = { ...transfer, base_fee: 10, price_per_km: 3, price_per_minute: 0.5, minimum_price: 50 };
    expect(calculatePrice({ service: s, routePrices: [], estimate: { distanceKm: 20, durationMin: 30 } })).toEqual({
      price: 85,
      source: "distance",
    });
    expect(calculatePrice({ service: s, routePrices: [], estimate: { distanceKm: 2, durationMin: 5 } }).price).toBe(50);
  });

  it("cobra por hora respeitando o mínimo de horas", () => {
    const s = { ...periodo, base_fee: 20, price_per_hour: 90, min_hours: 2 };
    expect(calculatePrice({ service: s, routePrices: [], hours: 1 })).toEqual({ price: 200, source: "hourly", billedHours: 2 });
    expect(calculatePrice({ service: s, routePrices: [], hours: 3.5 }).price).toBe(335);
  });
});
