import type { AdFormat, ImportRunStatus, Platform } from "@/modules/ads/types";

/**
 * Formatação em português do Brasil. Locale e fuso são fixos para que o
 * servidor e o navegador produzam exatamente o mesmo texto.
 */
const LOCALE = "pt-BR";
const TIME_ZONE = "America/Sao_Paulo";

const numberFormat = new Intl.NumberFormat(LOCALE);
const percentFormat = new Intl.NumberFormat(LOCALE, { style: "percent", maximumFractionDigits: 0, signDisplay: "exceptZero" });

export function formatNumber(value: number): string {
  return numberFormat.format(value);
}

/** Variação percentual entre dois valores, ex.: "+12%". Retorna null se não houver base. */
export function formatChange(current: number, previous: number): string | null {
  if (previous === 0) return null;
  return percentFormat.format((current - previous) / previous);
}

/** Data simples (AAAA-MM-DD) → "20 out. 2026". */
export function formatDate(isoDate: string, options?: Intl.DateTimeFormatOptions): string {
  const date = isoDate.length === 10 ? new Date(`${isoDate}T12:00:00Z`) : new Date(isoDate);
  return new Intl.DateTimeFormat(LOCALE, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: TIME_ZONE,
    ...options,
  }).format(date);
}

export function formatDateTime(isoDateTime: string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TIME_ZONE,
  }).format(new Date(isoDateTime));
}

export const PLATFORM_LABELS: Record<Platform, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  messenger: "Messenger",
  audience_network: "Audience Network",
};

export const FORMAT_LABELS: Record<AdFormat, string> = {
  imagem: "Imagem",
  video: "Vídeo",
  carrossel: "Carrossel",
  texto: "Texto",
};

export const IMPORT_STATUS_LABELS: Record<ImportRunStatus, string> = {
  concluida: "Concluída",
  parcial: "Parcial",
  falhou: "Falhou",
  em_andamento: "Em andamento",
};
