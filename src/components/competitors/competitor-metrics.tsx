import type { CompetitorStats } from "@/modules/competitors/stats";
import { FORMAT_LABELS, PLATFORM_LABELS, formatChange, formatDate, formatDays, formatNumber } from "@/lib/format";

/**
 * Lista única das métricas de concorrentes, usada no cartão, no perfil e na comparação,
 * para que os três mostrem exatamente os mesmos cálculos.
 */
export interface MetricDef {
  id: string;
  rotulo: string;
  valor: (s: CompetitorStats) => string;
  /** Valor numérico para destacar o maior na comparação (opcional). */
  numero?: (s: CompetitorStats) => number | null;
}

export const COMPETITOR_METRICS: MetricDef[] = [
  { id: "ativos", rotulo: "Anúncios ativos", valor: (s) => formatNumber(s.anunciosAtivos), numero: (s) => s.anunciosAtivos },
  {
    id: "variacao",
    rotulo: "Variação vs. 4 semanas",
    valor: (s) => formatChange(s.anunciosAtivos, s.anunciosAtivosPeriodoAnterior) ?? "—",
  },
  { id: "total", rotulo: "Anúncios observados", valor: (s) => formatNumber(s.totalAnuncios), numero: (s) => s.totalAnuncios },
  { id: "novos", rotulo: "Novos (30 dias)", valor: (s) => formatNumber(s.novosUltimos30Dias), numero: (s) => s.novosUltimos30Dias },
  {
    id: "media",
    rotulo: "Tempo médio no ar",
    valor: (s) => (s.mediaDiasNoAr !== null ? formatDays(s.mediaDiasNoAr) : "—"),
    numero: (s) => s.mediaDiasNoAr,
  },
  { id: "formato", rotulo: "Formato mais usado", valor: (s) => (s.formatoPrincipal ? FORMAT_LABELS[s.formatoPrincipal] : "—") },
  {
    id: "plataforma",
    rotulo: "Plataforma mais usada",
    valor: (s) => (s.plataformaPrincipal ? PLATFORM_LABELS[s.plataformaPrincipal] : "—"),
  },
  { id: "inicio", rotulo: "Primeiro anúncio observado", valor: (s) => (s.primeiroInicio ? formatDate(s.primeiroInicio) : "—") },
  { id: "coleta", rotulo: "Última coleta", valor: (s) => (s.ultimaColeta ? formatDate(s.ultimaColeta) : "—") },
];

export const METRICS_DISCLAIMER =
  "Estatísticas calculadas a partir dos anúncios observados. Não representam investimento, faturamento, vendas ou ROAS.";
