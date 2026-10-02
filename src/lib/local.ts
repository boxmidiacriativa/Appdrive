// Memória local do aparelho do cliente (conveniência, não é fonte de verdade).
// Lembra nome/telefone e os links das últimas reservas feitas neste celular.

export type SavedContact = { name: string; phone: string; email?: string };
export type SavedBooking = { token: string; code: string; pickupAt: string; service: string };

const CONTACT_KEY = "motorista:contato";
const BOOKINGS_KEY = "motorista:reservas";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // modo privado ou armazenamento bloqueado: segue sem lembrar
  }
}

export const loadContact = () => read<SavedContact | null>(CONTACT_KEY, null);
export const saveContact = (c: SavedContact) => write(CONTACT_KEY, c);

export const loadBookings = () => read<SavedBooking[]>(BOOKINGS_KEY, []);
export function rememberBooking(b: SavedBooking) {
  const list = loadBookings().filter((x) => x.token !== b.token);
  write(BOOKINGS_KEY, [b, ...list].slice(0, 10));
}
