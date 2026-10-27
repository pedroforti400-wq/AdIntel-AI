/**
 * Tipos de domínio do AdIntel AI.
 *
 * Estes tipos são o "formato normalizado único": toda fonte de dados
 * (demo, importação de arquivo, API oficial, fornecedor licenciado)
 * precisa converter seus dados para este formato antes de chegar às telas.
 * Eles espelham o modelo de banco planejado para o Supabase (Fase 4).
 */

/** Identificador do tipo de fonte de dados. */
export type DataSourceType =
  | "demo"
  | "importacao_arquivo"
  | "meta_oficial"
  | "fornecedor_licenciado";

export type Platform = "facebook" | "instagram" | "messenger" | "audience_network";

export type AdFormat = "imagem" | "video" | "carrossel" | "texto";

/**
 * Situação de cada campo do anúncio, conforme o que a fonte entregou.
 * Usamos isso para mostrar "não disponível nesta fonte" em vez de inventar valores.
 */
export type FieldStatus = "disponivel" | "nao_fornecido_pela_fonte" | "vazio";

export type AdField =
  | "texto"
  | "titulo"
  | "cta"
  | "link_destino"
  | "formato"
  | "plataformas"
  | "data_inicio"
  | "data_fim"
  | "criativo";

export type FieldAvailability = Partial<Record<AdField, FieldStatus>>;

export interface Advertiser {
  id: string;
  workspaceId: string;
  dataSourceId: string;
  /** ID da página na fonte original (quando a fonte informa). */
  externalId: string | null;
  nome: string;
  nicho: string;
  urlPagina: string | null;
  isDemo: boolean;
}

export interface Ad {
  id: string;
  workspaceId: string;
  advertiserId: string;
  dataSourceId: string;
  /** ID do anúncio na fonte original (quando a fonte informa). */
  externalId: string | null;
  /** Impressão digital do conteúdo, usada para deduplicar quando não há externalId. */
  contentHash: string;
  texto: string | null;
  titulo: string | null;
  cta: string | null;
  linkDestino: string | null;
  formato: AdFormat | null;
  plataformas: Platform[];
  paises: string[];
  /** Datas em ISO 8601 (AAAA-MM-DD). */
  dataInicio: string | null;
  dataFim: string | null;
  /** Situação na última coleta. `null` quando a fonte não informou (não inventamos). */
  ativo: boolean | null;
  /** Só guardamos/exibimos o criativo quando há autorização. */
  criativoAutorizado: boolean;
  criativoUrl: string | null;
  disponibilidadeCampos: FieldAvailability;
  primeiraColeta: string;
  ultimaColeta: string;
  /** Nome do arquivo de onde o anúncio veio (somente anúncios importados). */
  origemArquivo?: string | null;
  isDemo: boolean;
}

export interface Competitor {
  id: string;
  workspaceId: string;
  nome: string;
  nicho: string;
  notas: string | null;
  advertiserIds: string[];
  ativo: boolean;
  isDemo: boolean;
}

export type ImportRunStatus = "concluida" | "parcial" | "falhou" | "em_andamento";

export interface ImportRun {
  id: string;
  workspaceId: string;
  dataSourceId: string;
  status: ImportRunStatus;
  inicio: string;
  fim: string | null;
  descricao: string;
  totais: { novos: number; atualizados: number; duplicados: number; erros: number };
  isDemo: boolean;
}

export interface Search {
  id: string;
  workspaceId: string;
  termos: string;
  nicho: string | null;
  dataSourceId: string;
  salva: boolean;
  ultimaExecucao: string;
  totalResultados: number;
  isDemo: boolean;
}
