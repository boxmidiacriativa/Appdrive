import "server-only";
import type { RouteEstimate } from "./pricing";

// Ponto único de integração com mapas (distância, tempo, rota, autocomplete).
// Na fase 1 nenhum provedor está ligado: o preço vem da rota fixa, do valor por
// hora ou fica "a confirmar". Para ligar mapas depois (ex.: Google Routes API),
// implemente aqui usando uma chave só do servidor (ex.: GOOGLE_MAPS_SERVER_KEY)
// e devolva { distanceKm, durationMin }. Nada mais no app precisa mudar.

export function mapsEnabled(): boolean {
  return false;
}

export async function estimateRoute(
  _origin: string,
  _destination: string,
): Promise<RouteEstimate | null> {
  void _origin;
  void _destination;
  return null;
}
