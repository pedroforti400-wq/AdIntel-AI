import { describe, expect, it } from "vitest";

import { demoRepository } from "@/data/demo/repository";
import { DEMO_REFERENCE_DATE, demoAds, demoAdvertisers } from "@/data/demo/seed";
import { daysRunning } from "@/modules/ads/metrics";
import {
  DEFAULT_FILTERS,
  PAGE_SIZE,
  countActiveFilters,
  filterAds,
  filtersToSearchParams,
  normalizeText,
  paginate,
  parseFilters,
  sortAds,
  type AdFilters,
} from "@/modules/ads/search";
import type { Advertiser } from "@/modules/ads/types";

const advertisers = new Map<string, Advertiser>(demoAdvertisers.map((a) => [a.id, a]));
const f = (partial: Partial<AdFilters>): AdFilters => ({ ...DEFAULT_FILTERS, ...partial });

describe("parseFilters", () => {
  it("aceita valores válidos da URL", () => {
    const filters = parseFilters({ q: " treino ", formato: "video", status: "ativo", pagina: "2", ordem: "antigos" });
    expect(filters).toMatchObject({ q: "treino", formato: "video", status: "ativo", pagina: 2, ordem: "antigos" });
  });

  it("descarta valores inválidos em vez de quebrar", () => {
    const filters = parseFilters({ formato: "holograma", status: "talvez", pagina: "-3", ordem: "aleatoria", de: "ontem" });
    expect(filters).toEqual(DEFAULT_FILTERS);
  });

  it("usa o primeiro valor quando o parâmetro se repete", () => {
    expect(parseFilters({ plataforma: ["instagram", "facebook"] }).plataforma).toBe("instagram");
  });
});

describe("filtersToSearchParams", () => {
  it("omite valores padrão e vazios", () => {
    expect(filtersToSearchParams(f({ q: "moda", pagina: 1, ordem: "recentes" })).toString()).toBe("q=moda");
  });
});

describe("filterAds", () => {
  it("busca palavras-chave sem diferenciar acentos e maiúsculas", () => {
    expect(normalizeText("Fluência")).toBe("fluencia");
    const results = filterAds(demoAds, advertisers, f({ q: "FLUENCIA" }));
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((ad) => normalizeText(ad.texto ?? "").includes("fluencia"))).toBe(true);
  });

  it("encontra anúncios pelo nome do anunciante", () => {
    const results = filterAds(demoAds, advertisers, f({ q: "prisma" }));
    expect(results.length).toBe(demoAds.filter((ad) => ad.advertiserId === "adv-04").length);
  });

  it("combina filtros (todos precisam ser atendidos)", () => {
    const results = filterAds(demoAds, advertisers, f({ nicho: "Moda", formato: "video", status: "ativo" }));
    for (const ad of results) {
      expect(advertisers.get(ad.advertiserId)?.nicho).toBe("Moda");
      expect(ad.formato).toBe("video");
      expect(ad.ativo).toBe(true);
    }
    const expected = demoAds.filter(
      (ad) => advertisers.get(ad.advertiserId)?.nicho === "Moda" && ad.formato === "video" && ad.ativo,
    );
    expect(results.length).toBe(expected.length);
  });

  it("filtra por plataforma e por período de início", () => {
    const results = filterAds(demoAds, advertisers, f({ plataforma: "messenger", de: "2026-09-01", ate: "2026-09-30" }));
    for (const ad of results) {
      expect(ad.plataformas).toContain("messenger");
      expect(ad.dataInicio! >= "2026-09-01" && ad.dataInicio! <= "2026-09-30").toBe(true);
    }
  });

  it("retorna lista vazia quando nada atende (sem inventar resultados)", () => {
    expect(filterAds(demoAds, advertisers, f({ q: "palavra-que-não-existe-xyz" }))).toEqual([]);
  });

  it("conta os filtros ativos", () => {
    expect(countActiveFilters(f({ q: "a", formato: "video", ordem: "antigos", pagina: 3 }))).toBe(2);
  });
});

describe("sortAds", () => {
  it("ordena por início mais recente e mais antigo", () => {
    const recent = sortAds(demoAds, advertisers, "recentes", DEMO_REFERENCE_DATE);
    const old = sortAds(demoAds, advertisers, "antigos", DEMO_REFERENCE_DATE);
    expect(recent[0].dataInicio! >= recent.at(-1)!.dataInicio!).toBe(true);
    expect(old[0].dataInicio! <= old.at(-1)!.dataInicio!).toBe(true);
  });

  it("ordena por mais tempo no ar", () => {
    const sorted = sortAds(demoAds, advertisers, "mais_tempo_no_ar", DEMO_REFERENCE_DATE);
    const days = sorted.map((ad) => daysRunning(ad, DEMO_REFERENCE_DATE)!);
    expect(days).toEqual([...days].sort((a, b) => b - a));
  });

  it("não altera a lista original", () => {
    const before = demoAds.map((ad) => ad.id);
    sortAds(demoAds, advertisers, "anunciante", DEMO_REFERENCE_DATE);
    expect(demoAds.map((ad) => ad.id)).toEqual(before);
  });
});

describe("paginate", () => {
  const items = Array.from({ length: 30 }, (_, i) => i);

  it("recorta a página pedida", () => {
    const page = paginate(items, 2, 12);
    expect(page.itens).toEqual(items.slice(12, 24));
    expect(page.totalPaginas).toBe(3);
  });

  it("ajusta páginas fora do intervalo", () => {
    expect(paginate(items, 99, 12).pagina).toBe(3);
    expect(paginate([], 5).pagina).toBe(1);
  });
});

describe("demoRepository.searchAds", () => {
  it("devolve no máximo uma página de resultados reais da base", async () => {
    const { pagina } = await demoRepository.searchAds(DEFAULT_FILTERS);
    expect(pagina.total).toBe(demoAds.length);
    expect(pagina.itens.length).toBe(Math.min(PAGE_SIZE, demoAds.length));
    expect(pagina.itens.every((v) => v.anunciante.id === v.anuncio.advertiserId)).toBe(true);
  });

  it("encontra um anúncio pelo ID e retorna null para ID desconhecido", async () => {
    expect((await demoRepository.getAd(demoAds[0].id))?.anuncio.id).toBe(demoAds[0].id);
    expect(await demoRepository.getAd("nao-existe")).toBeNull();
  });
});
