// Formatação e datas. O app opera no horário de Brasília (sem horário de verão desde 2019).
export const TIMEZONE = "America/Sao_Paulo";
const BRT_OFFSET = "-03:00";

export function toPickupAt(date: string, time: string): Date {
  return new Date(`${date}T${time}:00${BRT_OFFSET}`);
}

export function formatMoney(value: number | null | undefined): string {
  if (value === null || value === undefined) return "A confirmar";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatDate(value: string | Date, opts?: Intl.DateTimeFormatOptions): string {
  return new Date(value).toLocaleDateString("pt-BR", {
    timeZone: TIMEZONE,
    weekday: "short",
    day: "2-digit",
    month: "short",
    ...opts,
  });
}

export function formatLongDate(value: string | Date): string {
  return new Date(value).toLocaleDateString("pt-BR", {
    timeZone: TIMEZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function formatTime(value: string | Date): string {
  return new Date(value).toLocaleTimeString("pt-BR", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Data local (AAAA-MM-DD) em Brasília
export function localDateKey(value: string | Date): string {
  return new Date(value).toLocaleDateString("en-CA", { timeZone: TIMEZONE });
}

// Início e fim do dia atual em Brasília, como instantes UTC
export function todayRange(now = new Date()): { start: Date; end: Date } {
  const key = localDateKey(now);
  const start = new Date(`${key}T00:00:00${BRT_OFFSET}`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

// Telefone brasileiro -> só dígitos com DDI 55
export function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.startsWith("55") && digits.length >= 12) return digits;
  return `55${digits}`;
}

export function isValidBrPhone(input: string): boolean {
  const digits = normalizePhone(input);
  return digits.length === 12 || digits.length === 13;
}

export function formatPhone(digits: string | null | undefined): string {
  if (!digits) return "";
  const d = digits.startsWith("55") ? digits.slice(2) : digits;
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return digits;
}

export function formatHours(hours: number | null | undefined): string {
  if (!hours) return "";
  const h = Number(hours);
  return `${h.toLocaleString("pt-BR")} ${h === 1 ? "hora" : "horas"}`;
}

// Valor digitado pelo Gui: aceita "150", "150,50", "1.250,00", "R$ 1250.00"
export function parseMoney(raw: FormDataEntryValue | null | undefined): number | null {
  const value = String(raw ?? "").trim().replace(/[R$\s]/g, "");
  if (!value) return null;
  const normalized = value.includes(",") ? value.replace(/\./g, "").replace(",", ".") : value;
  const n = Number(normalized);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null;
}
