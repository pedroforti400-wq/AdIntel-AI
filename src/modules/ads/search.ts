import { daysRunning } from "./metrics";
import type { Ad, AdFormat, Advertiser, Platform } from "./types";

/**
 * Busca, filtros, ordenação e paginação de anúncios.
 *
 * Funciona sobre qualquer lista de anúncios já normalizada, então serve
 * para os dados de demonstração hoje e para o banco de dados depois.
 */

export const PLATFORMS: Platform[] = ["facebook", "instagram", "messenger", "audience_network"];
export const FORMATS: AdFormat[] = ["imagem", "video", "carrossel", "texto"];
export const STATUSES = ["ativo", "inativo"] as const;
export type StatusFilter = (typeof STATUSES)[number];

export const SORT_OPTIONS = ["recentes", "antigos", "mais_tempo_no_ar", "anunciante"] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];

export const PAGE_SIZE = 12;

export interface AdFilters {
  q: string;
  nicho: string;
  anunciante: string;
  plataforma: Platform | "";
  formato: AdFormat | "";
  status: StatusFilter | "";
  /** Data de início a partir de (AAAA-MM-DD). */
  de: string;
  /** Data de início até (AAAA-MM-DD). */
  ate: string;
  ordem: SortOption;
  pagina: number;
}

export const DEFAULT_FILTERS: AdFilters = {
  q: "",
  nicho: "",
  anunciante: "",
  plataforma: "",
  formato: "",
  status: "",
  de: "",
  ate: "",
  ordem: "recentes",
  pagina: 1,
};

type RawParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

function oneOf<T extends string>(value: string, allowed: readonly T[]): T | "" {
  return (allowed as readonly string[]).includes(value) ? (value as T) : "";
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Lê os parâmetros da URL e descarta valores inválidos, em vez de quebrar a página. */
export function parseFilters(raw: RawParams): AdFilters {
  const pagina = Number.parseInt(first(raw.pagina), 10);
  const de = first(raw.de);
  const ate = first(raw.ate);
  return {
    q: first(raw.q).slice(0, 100),
    nicho: first(raw.nicho),
    anunciante: first(raw.anunciante),
    plataforma: oneOf(first(raw.plataforma), PLATFORMS),
    formato: oneOf(first(raw.formato), FORMATS),
    status: oneOf(first(raw.status), STATUSES),
    de: ISO_DATE.test(de) ? de : "",
    ate: ISO_DATE.test(ate) ? ate : "",
    ordem: oneOf(first(raw.ordem), SORT_OPTIONS) || "recentes",
    pagina: Number.isFinite(pagina) && pagina > 0 ? pagina : 1,
  };
}

/** Converte filtros de volta para parâmetros de URL, omitindo os valores padrão. */
export function filtersToSearchParams(filters: Partial<AdFilters>): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    const fallback = DEFAULT_FILTERS[key as keyof AdFilters];
    if (value === "" || value === undefined || value === fallback) continue;
    params.set(key, String(value));
  }
  return params;
}

/** Quantos filtros (além da ordenação e da página) estão em uso. */
export function countActiveFilters(filters: AdFilters): number {
  const keys: (keyof AdFilters)[] = ["q", "nicho", "anunciante", "plataforma", "formato", "status", "de", "ate"];
  return keys.filter((k) => filters[k] !== "").length;
}

/** Minúsculas e sem acentos, para que "ingles" encontre "inglês". */
export function normalizeText(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export function filterAds(ads: Ad[], advertisers: Map<string, Advertiser>, filters: AdFilters): Ad[] {
  const terms = normalizeText(filters.q).split(/\s+/).filter(Boolean);

  return ads.filter((ad) => {
    const advertiser = advertisers.get(ad.advertiserId);
    if (filters.anunciante && ad.advertiserId !== filters.anunciante) return false;
    if (filters.nicho && advertiser?.nicho !== filters.nicho) return false;
    if (filters.plataforma && !ad.plataformas.includes(filters.plataforma)) return false;
    if (filters.formato && ad.formato !== filters.formato) return false;
    if (filters.status === "ativo" && !ad.ativo) return false;
    if (filters.status === "inativo" && ad.ativo) return false;
    if (filters.de && (!ad.dataInicio || ad.dataInicio < filters.de)) return false;
    if (filters.ate && (!ad.dataInicio || ad.dataInicio > filters.ate)) return false;

    if (terms.length > 0) {
      const haystack = normalizeText(
        [ad.texto, ad.titulo, ad.cta, advertiser?.nome].filter(Boolean).join(" "),
      );
      // Todas as palavras digitadas precisam aparecer.
      if (!terms.every((t) => haystack.includes(t))) return false;
    }
    return true;
  });
}

export function sortAds(
  ads: Ad[],
  advertisers: Map<string, Advertiser>,
  ordem: SortOption,
  referenceDate: string,
): Ad[] {
  const sorted = [...ads];
  const byId = (a: Ad, b: Ad) => a.id.localeCompare(b.id);
  switch (ordem) {
    case "recentes":
      return sorted.sort((a, b) => (b.dataInicio ?? "").localeCompare(a.dataInicio ?? "") || byId(a, b));
    case "antigos":
      return sorted.sort((a, b) => (a.dataInicio ?? "").localeCompare(b.dataInicio ?? "") || byId(a, b));
    case "mais_tempo_no_ar":
      return sorted.sort(
        (a, b) => (daysRunning(b, referenceDate) ?? 0) - (daysRunning(a, referenceDate) ?? 0) || byId(a, b),
      );
    case "anunciante":
      return sorted.sort(
        (a, b) =>
          (advertisers.get(a.advertiserId)?.nome ?? "").localeCompare(
            advertisers.get(b.advertiserId)?.nome ?? "",
            "pt-BR",
          ) || byId(a, b),
      );
  }
}

export interface Page<T> {
  itens: T[];
  pagina: number;
  totalPaginas: number;
  total: number;
}

/** Recorta uma página. Páginas fora do intervalo são ajustadas para a última existente. */
export function paginate<T>(items: T[], pagina: number, pageSize = PAGE_SIZE): Page<T> {
  const totalPaginas = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(Math.max(1, pagina), totalPaginas);
  return {
    itens: items.slice((current - 1) * pageSize, current * pageSize),
    pagina: current,
    totalPaginas,
    total: items.length,
  };
}
