import {
  addDays,
  buildBreakdown,
  buildWeeklySeries,
  countNewBetween,
  daysRunning,
  isActiveOn,
  type BreakdownItem,
  type WeeklyPoint,
} from "@/modules/ads/metrics";
import type { Ad, AdFormat, Competitor, Platform } from "@/modules/ads/types";

/**
 * Estatísticas de concorrentes calculadas só a partir dos anúncios observados.
 * Não há estimativa de investimento, faturamento, vendas ou ROAS.
 */

/** Mínimo de anúncios para considerar o histórico semanal informativo. */
export const MIN_ADS_FOR_HISTORY = 3;
export const HISTORY_WEEKS = 12;

export interface CompetitorStats {
  totalAnuncios: number;
  anunciosAtivos: number;
  /** Ativos 28 dias antes da data de referência. */
  anunciosAtivosPeriodoAnterior: number;
  novosUltimos30Dias: number;
  /** Média de dias em veiculação (arredondada). */
  mediaDiasNoAr: number | null;
  formatoPrincipal: AdFormat | null;
  plataformaPrincipal: Platform | null;
  primeiroInicio: string | null;
  ultimaColeta: string | null;
}

export interface CompetitorSummary {
  concorrente: Competitor;
  estatisticas: CompetitorStats;
}

export interface CompetitorHistory {
  serieSemanal: WeeklyPoint[];
  plataformas: BreakdownItem<Platform>[];
  formatos: BreakdownItem<AdFormat>[];
  historicoSuficiente: boolean;
}

export function computeCompetitorStats(ads: Ad[], referenceDate: string): CompetitorStats {
  const durations = ads.map((ad) => daysRunning(ad, referenceDate)).filter((d): d is number => d !== null);
  const formatos = buildBreakdown<AdFormat>(ads, (ad) => (ad.formato ? [ad.formato] : []));
  const plataformas = buildBreakdown<Platform>(ads, (ad) => ad.plataformas);
  const starts = ads.map((ad) => ad.dataInicio).filter((d): d is string => d !== null).sort();
  const collections = ads.map((ad) => ad.ultimaColeta).sort();

  return {
    totalAnuncios: ads.length,
    anunciosAtivos: ads.filter((ad) => isActiveOn(ad, referenceDate)).length,
    anunciosAtivosPeriodoAnterior: ads.filter((ad) => isActiveOn(ad, addDays(referenceDate, -28))).length,
    novosUltimos30Dias: countNewBetween(ads, addDays(referenceDate, -30), referenceDate),
    mediaDiasNoAr: durations.length > 0 ? Math.round(durations.reduce((s, d) => s + d, 0) / durations.length) : null,
    formatoPrincipal: formatos[0]?.chave ?? null,
    plataformaPrincipal: plataformas[0]?.chave ?? null,
    primeiroInicio: starts[0] ?? null,
    ultimaColeta: collections.at(-1) ?? null,
  };
}

export function computeCompetitorHistory(ads: Ad[], referenceDate: string): CompetitorHistory {
  return {
    serieSemanal: buildWeeklySeries(ads, referenceDate, HISTORY_WEEKS),
    plataformas: buildBreakdown<Platform>(ads, (ad) => ad.plataformas),
    formatos: buildBreakdown<AdFormat>(ads, (ad) => (ad.formato ? [ad.formato] : [])),
    historicoSuficiente: ads.length >= MIN_ADS_FOR_HISTORY,
  };
}

/** Normaliza a seleção de comparação: remove repetidos e IDs desconhecidos, respeitando o limite. */
export function normalizeComparisonIds(
  raw: string | string[] | undefined,
  knownIds: string[],
  max = 4,
): string[] {
  const values = (Array.isArray(raw) ? raw : raw ? [raw] : []).flatMap((v) => v.split(","));
  return [...new Set(values.map((v) => v.trim()))].filter((id) => knownIds.includes(id)).slice(0, max);
}
