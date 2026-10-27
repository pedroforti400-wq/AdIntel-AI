import type { Ad, Advertiser, AdFormat, ImportRun, Platform, Search } from "@/modules/ads/types";
import type { BreakdownItem, WeeklyPoint } from "@/modules/ads/metrics";
import type { AdFilters, Page, SourceFilter } from "@/modules/ads/search";
import type { CompetitorHistory, CompetitorSummary } from "@/modules/competitors/stats";
import type { ProviderInfo } from "@/modules/providers/types";

/**
 * "Porta única" de acesso aos dados.
 *
 * As telas só conversam com esta interface. Hoje quem responde é a
 * implementação de demonstração; na Fase 4 entra a implementação com
 * Supabase, sem precisar mudar as telas.
 */

export type { BreakdownItem, WeeklyPoint };

export interface DashboardKpis {
  totalAnuncios: number;
  anunciosAtivos: number;
  anunciantes: number;
  concorrentesMonitorados: number;
  pesquisasSalvas: number;
  novosUltimos7Dias: number;
  novosSemanaAnterior: number;
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

/** Anúncio acompanhado do anunciante e da fonte, pronto para exibição. */
export interface AdView {
  anuncio: Ad;
  anunciante: Advertiser;
  fonte: ProviderInfo;
  /** Concorrente cadastrado ligado a este anunciante, se houver. */
  concorrenteId: string | null;
}

export interface SearchResult {
  dataReferencia: string;
  pagina: Page<AdView>;
}

export interface FilterOptions {
  nichos: string[];
  anunciantes: { id: string; nome: string }[];
  paises: string[];
  /** Fonte usada na busca e o que ela suporta (ou a combinação das fontes, quando "todas"). */
  fonte: ProviderInfo;
  /** Fontes ativas que podem ser escolhidas. */
  fontes: ProviderInfo[];
}

export interface CompetitorProfile extends CompetitorSummary {
  historico: CompetitorHistory;
  anuncios: AdView[];
  dataReferencia: string;
}

export interface Repository {
  getDashboard(): Promise<DashboardData>;
  searchAds(filters: AdFilters): Promise<SearchResult>;
  getFilterOptions(fonte?: SourceFilter | ""): Promise<FilterOptions>;
  getAd(id: string): Promise<AdView | null>;
  listAdIds(): Promise<string[]>;
  listCompetitors(): Promise<CompetitorSummary[]>;
  getCompetitor(id: string): Promise<CompetitorProfile | null>;
  /** Perfis na mesma ordem dos IDs; IDs desconhecidos são ignorados. */
  getCompetitors(ids: string[]): Promise<CompetitorProfile[]>;
}
