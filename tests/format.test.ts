import { describe, expect, it } from "vitest";

import { formatChange, formatDate, formatNumber } from "@/lib/format";

describe("formatação pt-BR", () => {
  it("formata números com separador de milhar brasileiro", () => {
    expect(formatNumber(12345)).toBe("12.345");
  });

  it("calcula variação percentual com sinal", () => {
    expect(formatChange(12, 10)).toBe("+20%");
    expect(formatChange(8, 10)).toBe("-20%");
    expect(formatChange(10, 10)).toBe("0%");
  });

  it("não inventa variação quando não há base de comparação", () => {
    expect(formatChange(5, 0)).toBeNull();
  });

  it("formata datas simples sem mudar o dia por causa do fuso", () => {
    expect(formatDate("2026-10-20")).toContain("20");
    expect(formatDate("2026-10-20")).toContain("2026");
  });
});
