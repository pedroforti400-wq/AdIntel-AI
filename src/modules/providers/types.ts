import type { Ad, AdField, Advertiser, DataSourceType } from "@/modules/ads/types";

/**
 * Contrato comum de todo provedor de dados ("adapter").
 *
 * Cada fonte declara o que consegue fazer (capacidades) e devolve anúncios
 * já no formato normalizado. As telas consultam as capacidades para
 * habilitar ou desabilitar filtros, sem conhecer detalhes da fonte.
 */

export type ProviderStatus =
  | "ativo"
  | "nao_configurado"
  | "planejado";

export type SearchFilter =
  | "palavra_chave"
  | "anunciante"
  | "nicho"
  | "plataforma"
  | "status"
  | "periodo"
  | "formato"
  | "pais";

export interface ProviderCapabilities {
  /** Filtros que a fonte realmente suporta. */
  filtros: SearchFilter[];
  /** Campos que a fonte costuma entregar. */
  campos: AdField[];
  /** A fonte permite busca sob demanda? */
  buscaSobDemanda: boolean;
  /** A fonte aceita arquivos enviados pelo usuário? */
  importacaoArquivo: boolean;
}

export interface ProviderInfo {
  id: string;
  tipo: DataSourceType;
  nome: string;
  descricao: string;
  status: ProviderStatus;
  /** Fase do roadmap em que a fonte será trabalhada. */
  fase: string;
  /** Limitações conhecidas, exibidas ao usuário com transparência. */
  limitacoes: string[];
  capacidades: ProviderCapabilities;
  isDemo: boolean;
}

export interface SearchParams {
  palavraChave?: string;
  anunciante?: string;
  nicho?: string;
}

export interface ProviderResult {
  anunciantes: Advertiser[];
  anuncios: Ad[];
  /** Momento da coleta (ISO 8601). */
  coletadoEm: string;
}

export interface DataProvider {
  info: ProviderInfo;
  /** Busca sob demanda. Só existe se `capacidades.buscaSobDemanda` for verdadeiro. */
  buscar?(params: SearchParams): Promise<ProviderResult>;
}
