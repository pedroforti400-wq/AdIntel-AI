import type { AdField, AdFormat, FieldAvailability, FieldStatus, Platform } from "@/modules/ads/types";
import { IMPORT_LIMITS } from "./limits";
import type { ColumnMapping, TargetField } from "./mapping";
import type { RawRecord } from "./parse";

/**
 * Normalização de uma linha do arquivo para o formato do AdIntel AI.
 *
 * Regras:
 * - Nada é inventado: campo ausente ou inválido fica vazio e é sinalizado.
 * - Links só são aceitos com http:// ou https:// (bloqueia "javascript:" e similares).
 * - Caracteres de controle são removidos; acentos, emojis e símbolos são mantidos.
 */

export interface NormalizedAd {
  anunciante: string;
  idPagina: string | null;
  nicho: string | null;
  idExterno: string | null;
  texto: string | null;
  titulo: string | null;
  cta: string | null;
  linkDestino: string | null;
  formato: AdFormat | null;
  plataformas: Platform[];
  paises: string[];
  dataInicio: string | null;
  dataFim: string | null;
  ativo: boolean | null;
  disponibilidade: FieldAvailability;
}

export type NormalizeResult =
  | { ok: true; anuncio: NormalizedAd; avisos: string[] }
  | { ok: false; motivo: string };

/** Remove caracteres de controle e espaços extras. Em textos longos, preserva as quebras de linha. */
export function cleanText(value: string | undefined, keepNewlines = false): string {
  if (!value) return "";
  const noControl = value.replace(keepNewlines ? /[\u0000-\u0009\u000b-\u001f\u007f]/g : /[\u0000-\u001f\u007f]/g, " ");
  return keepNewlines
    ? noControl.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim()
    : noControl.replace(/\s+/g, " ").trim();
}

function plain(value: string): string {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

const FORMAT_SYNONYMS: Record<string, AdFormat> = {
  imagem: "imagem", image: "imagem", foto: "imagem", img: "imagem", estatico: "imagem",
  video: "video", reels: "video",
  carrossel: "carrossel", carousel: "carrossel", carrosel: "carrossel",
  texto: "texto", text: "texto",
};

export function parseFormat(value: string): AdFormat | null {
  return FORMAT_SYNONYMS[plain(value)] ?? null;
}

const PLATFORM_SYNONYMS: Record<string, Platform> = {
  facebook: "facebook", fb: "facebook",
  instagram: "instagram", ig: "instagram", insta: "instagram",
  messenger: "messenger",
  "audience network": "audience_network", audience_network: "audience_network", an: "audience_network",
};

export function parsePlatforms(value: string): { plataformas: Platform[]; desconhecidas: string[] } {
  const plataformas: Platform[] = [];
  const desconhecidas: string[] = [];
  for (const part of value.split(/[,;|/]+/)) {
    const p = plain(part).replace(/[[\]"']/g, "").trim();
    if (!p) continue;
    const match = PLATFORM_SYNONYMS[p];
    if (match) {
      if (!plataformas.includes(match)) plataformas.push(match);
    } else {
      desconhecidas.push(part.trim());
    }
  }
  return { plataformas, desconhecidas };
}

function isRealDate(y: number, m: number, d: number): boolean {
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d && y >= 2000 && y <= 2100;
}

/** Aceita AAAA-MM-DD, AAAA-MM-DDTHH:MM..., DD/MM/AAAA e DD-MM-AAAA. Retorna AAAA-MM-DD ou null. */
export function parseDate(value: string): string | null {
  const v = value.trim();
  let y: number, m: number, d: number;
  const iso = /^(\d{4})-(\d{2})-(\d{2})(?:[T ].*)?$/.exec(v);
  const br = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(v);
  if (iso) [y, m, d] = [Number(iso[1]), Number(iso[2]), Number(iso[3])];
  else if (br) [y, m, d] = [Number(br[3]), Number(br[2]), Number(br[1])];
  else return null;
  if (!isRealDate(y, m, d)) return null;
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

const ACTIVE = ["ativo", "ativa", "active", "sim", "yes", "true", "1", "em veiculacao", "veiculando"];
const INACTIVE = ["inativo", "inativa", "inactive", "encerrado", "encerrada", "pausado", "nao", "no", "false", "0", "finalizado"];

export function parseStatus(value: string): boolean | null {
  const v = plain(value);
  if (ACTIVE.includes(v)) return true;
  if (INACTIVE.includes(v)) return false;
  return null;
}

/** Aceita somente links http/https válidos. */
export function parseLink(value: string): string | null {
  const v = value.trim();
  if (!/^https?:\/\//i.test(v)) return null;
  try {
    const url = new URL(v);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

const COUNTRY_NAMES: Record<string, string> = { brasil: "BR", brazil: "BR", portugal: "PT" };

export function parseCountries(value: string): string[] {
  const result: string[] = [];
  for (const part of value.split(/[,;|/]+/)) {
    const p = plain(part);
    const code = COUNTRY_NAMES[p] ?? (/^[a-z]{2}$/.test(p) ? p.toUpperCase() : null);
    if (code && !result.includes(code)) result.push(code);
  }
  return result;
}

/** Estado de um campo: não mapeado = a fonte não fornece; mapeado mas vazio/inválido = sem valor. */
function availability(mapped: boolean, hasValue: boolean) {
  if (!mapped) return "nao_fornecido_pela_fonte" as const;
  return hasValue ? ("disponivel" as const) : ("vazio" as const);
}

export function normalizeRecord(raw: RawRecord, mapping: ColumnMapping): NormalizeResult {
  const get = (field: TargetField) => (mapping[field] ? (raw[mapping[field]] ?? "") : "");

  for (const field of Object.keys(mapping) as TargetField[]) {
    if (get(field).length > IMPORT_LIMITS.maxCellLength) {
      return { ok: false, motivo: `O campo "${mapping[field]}" passa de ${IMPORT_LIMITS.maxCellLength} caracteres.` };
    }
  }

  const avisos: string[] = [];
  const anunciante = cleanText(get("anunciante")).slice(0, 200);
  if (!anunciante) return { ok: false, motivo: "Anunciante não informado." };

  const texto = cleanText(get("texto"), true) || null;
  const titulo = cleanText(get("titulo")).slice(0, 500) || null;
  const idExterno = cleanText(get("id_externo")).slice(0, 200) || null;

  const rawLink = cleanText(get("link_destino"));
  const linkDestino = rawLink ? parseLink(rawLink) : null;
  if (rawLink && !linkDestino) avisos.push("Link ignorado: só são aceitos endereços http:// ou https://.");

  if (!texto && !titulo && !linkDestino && !idExterno) {
    return { ok: false, motivo: "Linha sem texto, título, link ou ID do anúncio." };
  }

  const rawFormat = cleanText(get("formato"));
  const formato = rawFormat ? parseFormat(rawFormat) : null;
  if (rawFormat && !formato) avisos.push(`Formato "${rawFormat}" não reconhecido.`);

  const rawPlatforms = cleanText(get("plataformas"));
  const { plataformas, desconhecidas } = parsePlatforms(rawPlatforms);
  if (desconhecidas.length > 0) avisos.push(`Plataformas não reconhecidas: ${desconhecidas.join(", ")}.`);

  const rawStart = cleanText(get("data_inicio"));
  const dataInicio = rawStart ? parseDate(rawStart) : null;
  if (rawStart && !dataInicio) avisos.push(`Data de início inválida: "${rawStart}".`);

  const rawEnd = cleanText(get("data_fim"));
  let dataFim = rawEnd ? parseDate(rawEnd) : null;
  if (rawEnd && !dataFim) avisos.push(`Data de encerramento inválida: "${rawEnd}".`);
  if (dataInicio && dataFim && dataFim < dataInicio) {
    avisos.push("Data de encerramento anterior ao início foi ignorada.");
    dataFim = null;
  }

  const rawStatus = cleanText(get("status"));
  const ativo = rawStatus ? parseStatus(rawStatus) : null;
  if (rawStatus && ativo === null) avisos.push(`Situação "${rawStatus}" não reconhecida.`);

  const cta = cleanText(get("cta")).slice(0, 100) || null;
  const paises = parseCountries(cleanText(get("paises")));

  const disponibilidade = {
    texto: availability(!!mapping.texto, !!texto),
    titulo: availability(!!mapping.titulo, !!titulo),
    cta: availability(!!mapping.cta, !!cta),
    link_destino: availability(!!mapping.link_destino, !!linkDestino),
    formato: availability(!!mapping.formato, !!formato),
    plataformas: availability(!!mapping.plataformas, plataformas.length > 0),
    data_inicio: availability(!!mapping.data_inicio, !!dataInicio),
    data_fim: availability(!!mapping.data_fim, !!dataFim),
    // Criativos (imagens/vídeos) não são importados.
    criativo: "nao_fornecido_pela_fonte",
  } satisfies Record<AdField, FieldStatus> as FieldAvailability;

  return {
    ok: true,
    avisos,
    anuncio: {
      anunciante,
      idPagina: cleanText(get("id_pagina")).slice(0, 200) || null,
      nicho: cleanText(get("nicho")).slice(0, 100) || null,
      idExterno,
      texto,
      titulo,
      cta,
      linkDestino,
      formato,
      plataformas,
      paises,
      dataInicio,
      dataFim,
      ativo,
      disponibilidade,
    },
  };
}
