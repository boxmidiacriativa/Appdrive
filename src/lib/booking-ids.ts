import "server-only";
import { randomBytes, randomInt } from "node:crypto";

// Código curto mostrado ao cliente (sem letras/números ambíguos) e segredo do link público.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function newBookingCode(): string {
  return Array.from({ length: 6 }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join("");
}

export function newAccessToken(): string {
  return randomBytes(24).toString("base64url");
}
