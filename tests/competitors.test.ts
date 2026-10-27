import { describe, expect, it } from "vitest";

import { demoRepository } from "@/data/demo/repository";
import { DEMO_REFERENCE_DATE, demoAds, demoCompetitors } from "@/data/demo/seed";
import { isActiveOn } from "@/modules/ads/metrics";
import {
  MIN_ADS_FOR_HISTORY,
  computeCompetitorHistory,
  computeCompetitorStats,
  normalizeComparisonIds,
} from "@/modules/competitors/stats";

describe("computeCompetitorStats", () => {
  it("calcula contagens a partir dos anúncios observados", () => {
    const ads = demoAds.filter((ad) => ad.advertiserId === "adv-01");
    const stats = computeCompetitorStats(ads, DEMO_REFERENCE_DATE);
    expect(stats.totalAnuncios).toBe(ads.length);
    expect(stats.anunciosAtivos).toBe(ads.filter((ad) => isActiveOn(ad, DEMO_REFERENCE_DATE)).length);
    expect(stats.mediaDiasNoAr).toBeGreaterThan(0);
  });

  it("lida com concorrente sem anúncios sem inventar valores", () => {
    const stats = computeCompetitorStats([], DEMO_REFERENCE_DATE);
    expect(stats).toMatchObject({ totalAnuncios: 0, anunciosAtivos: 0, mediaDiasNoAr: null, formatoPrincipal: null });
    expect(computeCompetitorHistory([], DEMO_REFERENCE_DATE).historicoSuficiente).toBe(false);
  });

  it("só considera o histórico suficiente com o mínimo de anúncios", () => {
    const ads = demoAds.slice(0, MIN_ADS_FOR_HISTORY);
    expect(computeCompetitorHistory(ads, DEMO_REFERENCE_DATE).historicoSuficiente).toBe(true);
    expect(computeCompetitorHistory(ads.slice(0, -1), DEMO_REFERENCE_DATE).historicoSuficiente).toBe(false);
  });

  it("não expõe métricas financeiras", () => {
    const keys = Object.keys(computeCompetitorStats(demoAds, DEMO_REFERENCE_DATE)).join(" ").toLowerCase();
    for (const forbidden of ["faturamento", "receita", "vendas", "roas", "investimento"]) {
      expect(keys).not.toContain(forbidden);
    }
  });
});

describe("normalizeComparisonIds", () => {
  const known = demoCompetitors.map((c) => c.id);

  it("remove repetidos e IDs desconhecidos", () => {
    expect(normalizeComparisonIds(["comp-01", "comp-01", "x", "comp-02"], known)).toEqual(["comp-01", "comp-02"]);
  });

  it("aceita lista separada por vírgula e respeita o limite", () => {
    expect(normalizeComparisonIds("comp-01,comp-02,comp-03,comp-04,comp-05", known)).toHaveLength(4);
  });

  it("lida com ausência de seleção", () => {
    expect(normalizeComparisonIds(undefined, known)).toEqual([]);
  });
});

describe("demoRepository (concorrentes)", () => {
  it("os números da lista batem com os do painel", async () => {
    const [list, dashboard] = await Promise.all([demoRepository.listCompetitors(), demoRepository.getDashboard()]);
    for (const row of dashboard.concorrentes) {
      const summary = list.find((c) => c.concorrente.id === row.id)!;
      expect(summary.estatisticas.anunciosAtivos).toBe(row.anunciosAtivos);
      expect(summary.estatisticas.novosUltimos30Dias).toBe(row.novosUltimos30Dias);
    }
  });

  it("perfil traz apenas os anúncios do próprio concorrente", async () => {
    const profile = await demoRepository.getCompetitor("comp-03");
    expect(profile).not.toBeNull();
    expect(profile!.anuncios.every((v) => profile!.concorrente.advertiserIds.includes(v.anuncio.advertiserId))).toBe(true);
    expect(await demoRepository.getCompetitor("nao-existe")).toBeNull();
  });

  it("comparação mantém a ordem pedida e ignora IDs desconhecidos", async () => {
    const profiles = await demoRepository.getCompetitors(["comp-02", "nao-existe", "comp-01"]);
    expect(profiles.map((p) => p.concorrente.id)).toEqual(["comp-02", "comp-01"]);
  });
});
