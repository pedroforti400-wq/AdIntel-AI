import type { Ad, AdFormat, Advertiser, Competitor, Platform } from "@/modules/ads/types";
import type {
  AdView,
  CompetitorProfile,
  CompetitorRow,
  DashboardData,
  Repository,
} from "@/data/repositories/types";
import {
  addDays,
  buildBreakdown,
  buildWeeklySeries,
  countNewBetween,
  isActiveOn,
} from "@/modules/ads/metrics";
import { filterAds, paginate, sortAds } from "@/modules/ads/search";
import {
  computeCompetitorHistory,
  computeCompetitorStats,
  type CompetitorSummary,
} from "@/modules/competitors/stats";
import { getProviderInfo } from "@/modules/providers/registry";
import type { ProviderInfo } from "@/modules/providers/types";
import {
  DEMO_REFERENCE_DATE,
  DEMO_SOURCE_ID,
  demoAds,
  demoAdvertisers,
  demoCompetitors,
  demoImportRuns,
  demoSearches,
} from "./seed";

// Mantidos aqui por compatibilidade: os cálculos agora vivem em "@/modules/ads/metrics".
export { buildBreakdown, buildWeeklySeries, countNewBetween, isActiveOn };

const advertisersById = new Map<string, Advertiser>(demoAdvertisers.map((a) => [a.id, a]));
const demoSource = getProviderInfo(DEMO_SOURCE_ID) as ProviderInfo;

function competitorForAdvertiser(advertiserId: string): Competitor | undefined {
  return demoCompetitors.find((c) => c.advertiserIds.includes(advertiserId));
}

export { advertisersById as demoAdvertisersById };

export function toView(ad: Ad): AdView {
  return {
    anuncio: ad,
    anunciante: advertisersById.get(ad.advertiserId) as Advertiser,
    fonte: getProviderInfo(ad.dataSourceId) ?? demoSource,
    concorrenteId: competitorForAdvertiser(ad.advertiserId)?.id ?? null,
  };
}

function adsOf(competitor: Competitor): Ad[] {
  return demoAds.filter((ad) => competitor.advertiserIds.includes(ad.advertiserId));
}

function buildCompetitorRows(referenceDate: string): CompetitorRow[] {
  const previousDate = addDays(referenceDate, -28);
  return demoCompetitors.map((competitor) => {
    const ads = adsOf(competitor);
    return {
      id: competitor.id,
      nome: competitor.nome,
      nicho: competitor.nicho,
      anunciosAtivos: ads.filter((ad) => isActiveOn(ad, referenceDate)).length,
      anunciosAtivosPeriodoAnterior: ads.filter((ad) => isActiveOn(ad, previousDate)).length,
      novosUltimos30Dias: countNewBetween(ads, addDays(referenceDate, -30), referenceDate),
      ultimaColeta: ads.length > 0 ? ads[0].ultimaColeta : null,
    };
  });
}

function summaryOf(competitor: Competitor): CompetitorSummary {
  return { concorrente: competitor, estatisticas: computeCompetitorStats(adsOf(competitor), DEMO_REFERENCE_DATE) };
}

function profileOf(competitor: Competitor): CompetitorProfile {
  const ads = adsOf(competitor);
  return {
    ...summaryOf(competitor),
    historico: computeCompetitorHistory(ads, DEMO_REFERENCE_DATE),
    anuncios: sortAds(ads, advertisersById, "recentes", DEMO_REFERENCE_DATE).map(toView),
    dataReferencia: DEMO_REFERENCE_DATE,
  };
}

export const demoRepository: Repository = {
  async getDashboard(): Promise<DashboardData> {
    const ref = DEMO_REFERENCE_DATE;
    const activeAds = demoAds.filter((ad) => isActiveOn(ad, ref));

    return {
      dataReferencia: ref,
      isDemo: true,
      kpis: {
        totalAnuncios: demoAds.length,
        anunciosAtivos: activeAds.length,
        anunciantes: demoAdvertisers.length,
        concorrentesMonitorados: demoCompetitors.filter((c) => c.ativo).length,
        pesquisasSalvas: demoSearches.filter((s) => s.salva).length,
        novosUltimos7Dias: countNewBetween(demoAds, addDays(ref, -7), ref),
        novosSemanaAnterior: countNewBetween(demoAds, addDays(ref, -14), addDays(ref, -7)),
      },
      serieSemanal: buildWeeklySeries(demoAds, ref, 12),
      plataformas: buildBreakdown<Platform>(activeAds, (ad) => ad.plataformas),
      formatos: buildBreakdown<AdFormat>(activeAds, (ad) => (ad.formato ? [ad.formato] : [])),
      concorrentes: buildCompetitorRows(ref),
      pesquisasRecentes: demoSearches,
      importacoesRecentes: demoImportRuns,
    };
  },

  async searchAds(filters) {
    const filtered = filterAds(demoAds, advertisersById, filters);
    const sorted = sortAds(filtered, advertisersById, filters.ordem, DEMO_REFERENCE_DATE);
    const page = paginate(sorted, filters.pagina);
    return {
      dataReferencia: DEMO_REFERENCE_DATE,
      pagina: { ...page, itens: page.itens.map(toView) },
    };
  },

  async getFilterOptions() {
    return {
      nichos: [...new Set(demoAdvertisers.map((a) => a.nicho))].sort((a, b) => a.localeCompare(b, "pt-BR")),
      anunciantes: demoAdvertisers
        .map((a) => ({ id: a.id, nome: a.nome }))
        .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
      paises: [...new Set(demoAds.flatMap((ad) => ad.paises))].sort(),
      fonte: demoSource,
      fontes: [demoSource],
    };
  },

  async getAd(id) {
    const ad = demoAds.find((a) => a.id === id);
    return ad ? toView(ad) : null;
  },

  async listAdIds() {
    return demoAds.map((ad) => ad.id);
  },

  async listCompetitors() {
    return demoCompetitors.map(summaryOf);
  },

  async getCompetitor(id) {
    const competitor = demoCompetitors.find((c) => c.id === id);
    return competitor ? profileOf(competitor) : null;
  },

  async getCompetitors(ids) {
    return ids
      .map((id) => demoCompetitors.find((c) => c.id === id))
      .filter((c): c is Competitor => c !== undefined)
      .map(profileOf);
  },
};

export { DEMO_REFERENCE_DATE };
