// Gera o "Pix copia e cola" (BR Code estático, padrão EMV do Banco Central)
// para a chave Pix do motorista, já com o valor. Não usa gateway nem tem custo.
// A confirmação do pagamento é manual (o Gui marca como pago no painel).

export type PixKeyType = "cpf" | "cnpj" | "phone" | "email" | "random";

export type PixPayloadInput = {
  keyType: PixKeyType;
  key: string;
  receiverName: string;
  city: string;
  amount?: number | null;
  txid?: string;
};

function field(id: string, value: string) {
  const len = value.length;
  if (len > 99) throw new Error(`Campo Pix ${id} muito longo`);
  return `${id}${String(len).padStart(2, "0")}${value}`;
}

// Remove acentos e caracteres fora do conjunto aceito pelos bancos
function sanitize(text: string, max: number) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9 .\-]/g, "")
    .trim()
    .toUpperCase()
    .slice(0, max);
}

export function normalizePixKey(type: PixKeyType, key: string): string {
  const raw = key.trim();
  switch (type) {
    case "cpf":
    case "cnpj":
      return raw.replace(/\D/g, "");
    case "phone": {
      const digits = raw.replace(/\D/g, "");
      const withCountry = digits.startsWith("55") && digits.length >= 12 ? digits : `55${digits}`;
      return `+${withCountry}`;
    }
    case "email":
      return raw.toLowerCase();
    case "random":
      return raw.toLowerCase();
  }
}

export function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let b = 0; b < 8; b++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export function buildPixPayload(input: PixPayloadInput): string {
  const key = normalizePixKey(input.keyType, input.key);
  const merchantAccount = field("00", "br.gov.bcb.pix") + field("01", key);
  const txid = (input.txid ?? "***").replace(/[^A-Za-z0-9*]/g, "").slice(0, 25) || "***";

  let payload =
    field("00", "01") +
    field("26", merchantAccount) +
    field("52", "0000") +
    field("53", "986");

  if (input.amount && input.amount > 0) {
    payload += field("54", input.amount.toFixed(2));
  }

  payload +=
    field("58", "BR") +
    field("59", sanitize(input.receiverName, 25) || "RECEBEDOR") +
    field("60", sanitize(input.city, 15) || "BRASIL") +
    field("62", field("05", txid));

  payload += "6304";
  return payload + crc16(payload);
}
