import type { AdFormat, ImportRun, Platform, Search } from "@/modules/ads/types";

/**
 * "Porta única" de acesso aos dados.
 *
 * As telas só conversam com esta interface. Hoje quem responde é a
 * implementação de demonstração; na Fase 4 entra a implementação com
 * Supabase, sem precisar mudar as telas.
 */

export interface DashboardKpis {
  totalAnuncios: number;
  anunciosAtivos: number;
  anunciantes: number;
  concorrentesMonitorados: number;
  pesquisasSalvas: number;
  novosUltimos7Dias: number;
  novosSemanaAnterior: number;
}

export interface WeeklyPoint {
  /** Início da semana (AAAA-MM-DD). */
  semana: string;
  novos: number;
  ativos: number;
}

export interface BreakdownItem<K extends string> {
  chave: K;
  total: number;
}

export interface CompetitorRow {
  id: string;
  nome: string;
  nicho: string;
  anunciosAtivos: number;
  /** Anúncios ativos 28 dias antes da data de referência. */
  anunciosAtivosPeriodoAnterior: number;
  novosUltimos30Dias: number;
  ultimaColeta: string | null;
}

export interface DashboardData {
  dataReferencia: string;
  isDemo: boolean;
  kpis: DashboardKpis;
  serieSemanal: WeeklyPoint[];
  plataformas: BreakdownItem<Platform>[];
  formatos: BreakdownItem<AdFormat>[];
  concorrentes: CompetitorRow[];
  pesquisasRecentes: Search[];
  importacoesRecentes: ImportRun[];
}

export interface Repository {
  getDashboard(): Promise<DashboardData>;
}
