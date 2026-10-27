import type { Ad, AdFormat, Platform } from "@/modules/ads/types";
import type {
  BreakdownItem,
  CompetitorRow,
  DashboardData,
  Repository,
  WeeklyPoint,
} from "@/data/repositories/types";
import {
  DEMO_REFERENCE_DATE,
  addDays,
  demoAds,
  demoAdvertisers,
  demoCompetitors,
  demoImportRuns,
  demoSearches,
} from "./seed";

/** Um anúncio está ativo numa data se já começou e ainda não terminou. */
export function isActiveOn(ad: Ad, date: string): boolean {
  if (!ad.dataInicio || ad.dataInicio > date) return false;
  return ad.dataFim === null || ad.dataFim >= date;
}

export function countNewBetween(ads: Ad[], from: string, to: string): number {
  return ads.filter((ad) => ad.dataInicio !== null && ad.dataInicio > from && ad.dataInicio <= to).length;
}

export function buildWeeklySeries(ads: Ad[], referenceDate: string, weeks: number): WeeklyPoint[] {
  const points: WeeklyPoint[] = [];
  for (let w = weeks - 1; w >= 0; w--) {
    const weekEnd = addDays(referenceDate, -7 * w);
    const weekStart = addDays(weekEnd, -6);
    points.push({
      semana: weekStart,
      novos: countNewBetween(ads, addDays(weekStart, -1), weekEnd),
      ativos: ads.filter((ad) => isActiveOn(ad, weekEnd)).length,
    });
  }
  return points;
}

export function buildBreakdown<K extends string>(
  ads: Ad[],
  keysOf: (ad: Ad) => K[],
): BreakdownItem<K>[] {
  const totals = new Map<K, number>();
  for (const ad of ads) {
    for (const key of keysOf(ad)) totals.set(key, (totals.get(key) ?? 0) + 1);
  }
  return [...totals.entries()]
    .map(([chave, total]) => ({ chave, total }))
    .sort((a, b) => b.total - a.total);
}

function buildCompetitorRows(referenceDate: string): CompetitorRow[] {
  const previousDate = addDays(referenceDate, -28);
  return demoCompetitors.map((competitor) => {
    const ads = demoAds.filter((ad) => competitor.advertiserIds.includes(ad.advertiserId));
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
};
