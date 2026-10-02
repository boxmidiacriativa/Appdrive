import { describe, expect, it } from "vitest";
import { buildPixPayload, crc16, normalizePixKey } from "../pix";

describe("pix", () => {
  it("calcula o CRC do exemplo oficial do Banco Central", () => {
    const body =
      "00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-4266554400005204000053039865802BR5913Fulano de Tal6008BRASILIA62070503***6304";
    expect(crc16(body)).toBe("1D3D");
  });

  it("monta payload com valor, nome e cidade sem acentos", () => {
    const payload = buildPixPayload({
      keyType: "random",
      key: "123e4567-e12b-12d1-a456-426655440000",
      receiverName: "Guilherme Antônio",
      city: "Balneário Camboriú",
      amount: 150,
      txid: "AB12CD",
    });
    expect(payload).toContain("0014br.gov.bcb.pix");
    expect(payload).toContain("5406150.00");
    expect(payload).toContain("5917GUILHERME ANTONIO");
    expect(payload).toContain("6015BALNEARIO CAMBO");
    expect(payload).toContain("62100506AB12CD");
    const body = payload.slice(0, -4);
    expect(payload.slice(-4)).toBe(crc16(body));
  });

  it("omite o valor quando não informado", () => {
    const payload = buildPixPayload({ keyType: "email", key: "Gui@Exemplo.com", receiverName: "Gui", city: "Itajai" });
    expect(payload).not.toMatch(/54\d{2}\d+\.\d{2}5802BR/);
    expect(payload).toContain("gui@exemplo.com");
  });

  it("normaliza chaves", () => {
    expect(normalizePixKey("cpf", "123.456.789-09")).toBe("12345678909");
    expect(normalizePixKey("phone", "(47) 99999-1234")).toBe("+5547999991234");
    expect(normalizePixKey("phone", "+55 47 99999-1234")).toBe("+5547999991234");
  });
});
