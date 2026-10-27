import type { Ad } from "./types";

/**
 * Cálculos sobre anúncios observados. Todos são contagens ou datas
 * derivadas dos próprios dados — nenhuma estimativa de investimento ou resultado.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

export function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  return new Date(d.getTime() + days * DAY_MS).toISOString().slice(0, 10);
}

/** Um anúncio está ativo numa data se já começou e ainda não terminou. */
export function isActiveOn(ad: Ad, date: string): boolean {
  if (!ad.dataInicio || ad.dataInicio > date) return false;
  return ad.dataFim === null || ad.dataFim >= date;
}

export function countNewBetween(ads: Ad[], from: string, to: string): number {
  return ads.filter((ad) => ad.dataInicio !== null && ad.dataInicio > from && ad.dataInicio <= to).length;
}

/** Dias em veiculação: do início até o fim conhecido (ou até a data de referência, se ainda ativo). */
export function daysRunning(ad: Ad, referenceDate: string): number | null {
  if (!ad.dataInicio) return null;
  const end = ad.dataFim ?? referenceDate;
  const ms = new Date(`${end}T00:00:00Z`).getTime() - new Date(`${ad.dataInicio}T00:00:00Z`).getTime();
  return Math.max(0, Math.round(ms / DAY_MS)) + 1;
}

/**
 * Dias em veiculação usando só o que se sabe do próprio anúncio:
 * até a data de encerramento, ou até a última coleta se ele estava ativo.
 * Se a situação é desconhecida e não há data de fim, retorna null (não inventamos).
 */
export function knownDaysRunning(ad: Ad): number | null {
  if (!ad.dataInicio) return null;
  if (ad.dataFim) return daysRunning(ad, ad.dataFim);
  if (ad.ativo === true) return daysRunning(ad, ad.ultimaColeta);
  return null;
}

export interface WeeklyPoint {
  /** Início da semana (AAAA-MM-DD). */
  semana: string;
  novos: number;
  ativos: number;
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

export interface BreakdownItem<K extends string> {
  chave: K;
  total: number;
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
