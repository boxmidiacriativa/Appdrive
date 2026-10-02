import { describe, expect, it } from "vitest";
import { formatPhone, isValidBrPhone, normalizePhone, todayRange, toPickupAt } from "../format";

describe("format", () => {
  it("normaliza telefone brasileiro", () => {
    expect(normalizePhone("(47) 99999-1234")).toBe("5547999991234");
    expect(normalizePhone("+55 47 99999-1234")).toBe("5547999991234");
    expect(isValidBrPhone("47 9999")).toBe(false);
    expect(formatPhone("5547999991234")).toBe("(47) 99999-1234");
  });

  it("interpreta data e hora no horário de Brasília", () => {
    expect(toPickupAt("2026-10-12", "14:30").toISOString()).toBe("2026-10-12T17:30:00.000Z");
  });

  it("calcula o dia de hoje em Brasília", () => {
    const { start, end } = todayRange(new Date("2026-10-12T02:00:00Z")); // 23h do dia 11 em Brasília
    expect(start.toISOString()).toBe("2026-10-11T03:00:00.000Z");
    expect(end.toISOString()).toBe("2026-10-12T03:00:00.000Z");
  });
});

import { parseMoney } from "../format";

describe("parseMoney", () => {
  it("entende valores no formato brasileiro", () => {
    expect(parseMoney("150")).toBe(150);
    expect(parseMoney("150,50")).toBe(150.5);
    expect(parseMoney("1.250,00")).toBe(1250);
    expect(parseMoney("R$ 1250.00")).toBe(1250);
    expect(parseMoney("")).toBeNull();
    expect(parseMoney("abc")).toBeNull();
    expect(parseMoney("-5")).toBeNull();
  });
});
