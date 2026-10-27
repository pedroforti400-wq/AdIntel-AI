import { describe, expect, it } from "vitest";

import { buildWeeklySeries, countNewBetween, demoRepository, isActiveOn } from "@/data/demo/repository";
import { DEMO_REFERENCE_DATE, addDays, demoAds } from "@/data/demo/seed";
import type { Ad } from "@/modules/ads/types";

function makeAd(dataInicio: string, dataFim: string | null): Ad {
  return { ...demoAds[0], id: `t-${dataInicio}`, dataInicio, dataFim };
}

describe("isActiveOn", () => {
  it("considera ativo entre o início e o fim, inclusive", () => {
    const ad = makeAd("2026-10-01", "2026-10-10");
    expect(isActiveOn(ad, "2026-09-30")).toBe(false);
    expect(isActiveOn(ad, "2026-10-01")).toBe(true);
    expect(isActiveOn(ad, "2026-10-10")).toBe(true);
    expect(isActiveOn(ad, "2026-10-11")).toBe(false);
  });

  it("considera ativo sem data de fim", () => {
    expect(isActiveOn(makeAd("2026-10-01", null), "2027-01-01")).toBe(true);
  });
});

describe("countNewBetween", () => {
  it("conta anúncios iniciados após 'de' e até 'até'", () => {
    const ads = [makeAd("2026-10-01", null), makeAd("2026-10-05", null), makeAd("2026-10-08", null)];
    expect(countNewBetween(ads, "2026-10-01", "2026-10-05")).toBe(1);
  });
});

describe("buildWeeklySeries", () => {
  it("gera uma semana por ponto e soma todos os novos do período", () => {
    const series = buildWeeklySeries(demoAds, DEMO_REFERENCE_DATE, 12);
    expect(series).toHaveLength(12);
    const total = series.reduce((sum, p) => sum + p.novos, 0);
    expect(total).toBe(countNewBetween(demoAds, addDays(series[0].semana, -1), DEMO_REFERENCE_DATE));
  });
});

describe("dados de demonstração", () => {
  it("são sempre identificados como demonstração", async () => {
    const data = await demoRepository.getDashboard();
    expect(data.isDemo).toBe(true);
    expect(demoAds.every((ad) => ad.isDemo)).toBe(true);
    expect(data.pesquisasRecentes.every((s) => s.isDemo)).toBe(true);
    expect(data.importacoesRecentes.every((r) => r.isDemo)).toBe(true);
  });

  it("são determinísticos (iguais a cada execução)", async () => {
    const a = await demoRepository.getDashboard();
    const b = await demoRepository.getDashboard();
    expect(a).toEqual(b);
  });

  it("têm indicadores coerentes", async () => {
    const { kpis } = await demoRepository.getDashboard();
    expect(kpis.totalAnuncios).toBeGreaterThan(0);
    expect(kpis.anunciosAtivos).toBeLessThanOrEqual(kpis.totalAnuncios);
  });

  it("não guardam criativos sem autorização", () => {
    expect(demoAds.every((ad) => ad.criativoAutorizado || ad.criativoUrl === null)).toBe(true);
  });
});
