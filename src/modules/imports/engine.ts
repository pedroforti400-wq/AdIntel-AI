import { createHash } from "node:crypto";

import { normalizeText } from "@/modules/ads/search";
import type { Ad, Advertiser, ImportRun } from "@/modules/ads/types";
import { IMPORT_LIMITS, type ImportFormat } from "./limits";
import type { ColumnMapping } from "./mapping";
import { normalizeRecord, type NormalizedAd } from "./normalize";
import type { RawRecord } from "./parse";

/**
 * Motor de importação: aplica as linhas de um arquivo sobre os dados já importados,
 * com deduplicação. É uma função "pura" (recebe e devolve dados), o que facilita testar.
 *
 * Como um anúncio repetido é reconhecido:
 * 1. Pelo ID do anúncio na fonte, quando o arquivo traz essa coluna.
 * 2. Senão, por uma "impressão digital" (hash) de anunciante + texto + título + link + data de início,
 *    ignorando maiúsculas, acentos e espaços extras.
 */

export const IMPORT_SOURCE_ID = "importacao-arquivo";
export const IMPORT_WORKSPACE_ID = "ws-local";

export interface RejectedRow {
  /** Número da linha no arquivo (a linha 1 é o cabeçalho no CSV). */
  linha: number;
  motivo: string;
}

export interface ImportRunRecord extends ImportRun {
  arquivo: string;
  formato: ImportFormat;
  totalLinhas: number;
  avisos: number;
  /** Primeiras linhas rejeitadas, com o motivo. */
  rejeitadas: RejectedRow[];
}

export interface Observation {
  adId: string;
  importRunId: string;
  coletadoEm: string;
  resultado: "novo" | "atualizado" | "duplicado";
}

export interface ImportStore {
  versao: 1;
  anunciantes: Advertiser[];
  anuncios: Ad[];
  execucoes: ImportRunRecord[];
  observacoes: Observation[];
}

export function emptyStore(): ImportStore {
  return { versao: 1, anunciantes: [], anuncios: [], execucoes: [], observacoes: [] };
}

export interface ImportSummary {
  execucao: ImportRunRecord;
  novos: number;
  atualizados: number;
  duplicados: number;
  rejeitados: number;
}

export interface ImportInput {
  arquivo: string;
  formato: ImportFormat;
  linhas: RawRecord[];
  mapeamento: ColumnMapping;
  /** Momento da importação (ISO 8601). */
  agora: string;
}

const MAX_REJECTED_LISTED = 50;

function sha(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function norm(value: string | null): string {
  return value ? normalizeText(value).replace(/\s+/g, " ").trim() : "";
}

export function contentHash(ad: Pick<NormalizedAd, "anunciante" | "texto" | "titulo" | "linkDestino" | "dataInicio">): string {
  return sha([norm(ad.anunciante), norm(ad.texto), norm(ad.titulo), ad.linkDestino ?? "", ad.dataInicio ?? ""].join("|"));
}

/** Campos comparados para decidir se um anúncio repetido mudou ("atualizado") ou não ("duplicado"). */
function fingerprint(ad: Ad): string {
  return JSON.stringify([
    ad.advertiserId, ad.texto, ad.titulo, ad.cta, ad.linkDestino, ad.formato,
    ad.plataformas, ad.paises, ad.dataInicio, ad.dataFim, ad.ativo,
  ]);
}

/** Combina o anúncio existente com a nova linha. Campos que o novo arquivo não traz mantêm o valor anterior. */
function mergeAd(existing: Ad, incoming: Ad): Ad {
  const merged: Ad = { ...existing };
  const availability = { ...existing.disponibilidadeCampos };
  const take = <K extends keyof Ad>(key: K, field: keyof typeof availability) => {
    const status = incoming.disponibilidadeCampos[field];
    if (status && status !== "nao_fornecido_pela_fonte") {
      merged[key] = incoming[key];
      availability[field] = status;
    }
  };
  take("texto", "texto");
  take("titulo", "titulo");
  take("cta", "cta");
  take("linkDestino", "link_destino");
  take("formato", "formato");
  take("plataformas", "plataformas");
  take("dataInicio", "data_inicio");
  take("dataFim", "data_fim");
  if (incoming.ativo !== null) merged.ativo = incoming.ativo;
  if (incoming.paises.length > 0) merged.paises = incoming.paises;
  if (incoming.externalId) merged.externalId = incoming.externalId;
  merged.advertiserId = incoming.advertiserId;
  merged.disponibilidadeCampos = availability;
  merged.contentHash = incoming.contentHash;
  return merged;
}

export function applyImport(store: ImportStore, input: ImportInput): { store: ImportStore; resumo: ImportSummary } {
  const dataColeta = input.agora.slice(0, 10);
  const runId = `imp-run-${sha(`${input.agora}|${input.arquivo}|${store.execucoes.length}`).slice(0, 12)}`;

  const anunciantes = [...store.anunciantes];
  const anuncios = [...store.anuncios];
  const observacoes = [...store.observacoes];
  const adIndexById = new Map(anuncios.map((ad, i) => [ad.id, i]));
  const adIdByExternal = new Map(anuncios.filter((a) => a.externalId).map((a) => [norm(a.externalId), a.id]));
  const adIdByHash = new Map(anuncios.map((a) => [a.contentHash, a.id]));
  const touchedThisRun = new Set<string>();

  let novos = 0, atualizados = 0, duplicados = 0, avisos = 0;
  const rejeitadas: RejectedRow[] = [];
  let rejeitados = 0;
  const reject = (linha: number, motivo: string) => {
    rejeitados++;
    if (rejeitadas.length < MAX_REJECTED_LISTED) rejeitadas.push({ linha, motivo });
  };

  function upsertAdvertiser(n: NormalizedAd): Advertiser {
    const byPage = n.idPagina ? anunciantes.find((a) => a.externalId === n.idPagina) : undefined;
    const byName = anunciantes.find((a) => norm(a.nome) === norm(n.anunciante));
    const found = byPage ?? byName;
    if (found) {
      const i = anunciantes.indexOf(found);
      anunciantes[i] = {
        ...found,
        externalId: found.externalId ?? n.idPagina,
        nicho: n.nicho ?? found.nicho,
      };
      return anunciantes[i];
    }
    const key = n.idPagina ? `pg:${n.idPagina}` : `nm:${norm(n.anunciante)}`;
    const created: Advertiser = {
      id: `imp-adv-${sha(key).slice(0, 12)}`,
      workspaceId: IMPORT_WORKSPACE_ID,
      dataSourceId: IMPORT_SOURCE_ID,
      externalId: n.idPagina,
      nome: n.anunciante,
      nicho: n.nicho ?? "Não informado",
      urlPagina: null,
      isDemo: false,
    };
    anunciantes.push(created);
    return created;
  }

  input.linhas.forEach((raw, index) => {
    // No CSV a linha 1 é o cabeçalho; no JSON contamos os itens a partir de 1.
    const linha = input.formato === "csv" ? index + 2 : index + 1;
    const result = normalizeRecord(raw, input.mapeamento);
    if (!result.ok) return reject(linha, result.motivo);
    avisos += result.avisos.length;

    const n = result.anuncio;
    const hash = contentHash(n);
    const existingId =
      (n.idExterno ? adIdByExternal.get(norm(n.idExterno)) : undefined) ?? adIdByHash.get(hash);

    if (existingId && touchedThisRun.has(existingId)) {
      duplicados++;
      return;
    }
    if (!existingId && anuncios.length >= IMPORT_LIMITS.maxStoredAds) {
      return reject(linha, `Limite de ${IMPORT_LIMITS.maxStoredAds} anúncios importados atingido.`);
    }

    const advertiser = upsertAdvertiser(n);
    const id = existingId ?? `imp-${sha(n.idExterno ? `ext:${norm(n.idExterno)}` : `hash:${hash}`).slice(0, 16)}`;
    const incoming: Ad = {
      id,
      workspaceId: IMPORT_WORKSPACE_ID,
      advertiserId: advertiser.id,
      dataSourceId: IMPORT_SOURCE_ID,
      externalId: n.idExterno,
      contentHash: hash,
      texto: n.texto,
      titulo: n.titulo,
      cta: n.cta,
      linkDestino: n.linkDestino,
      formato: n.formato,
      plataformas: n.plataformas,
      paises: n.paises,
      dataInicio: n.dataInicio,
      dataFim: n.dataFim,
      ativo: n.ativo,
      criativoAutorizado: false,
      criativoUrl: null,
      disponibilidadeCampos: n.disponibilidade,
      primeiraColeta: dataColeta,
      ultimaColeta: dataColeta,
      origemArquivo: input.arquivo,
      isDemo: false,
    };

    let resultado: Observation["resultado"];
    if (existingId) {
      const i = adIndexById.get(existingId)!;
      const previous = anuncios[i];
      const merged = { ...mergeAd(previous, incoming), ultimaColeta: dataColeta, origemArquivo: input.arquivo };
      resultado = fingerprint(merged) === fingerprint(previous) ? "duplicado" : "atualizado";
      anuncios[i] = merged;
    } else {
      resultado = "novo";
      adIndexById.set(id, anuncios.length);
      anuncios.push(incoming);
    }

    if (resultado === "novo") novos++;
    else if (resultado === "atualizado") atualizados++;
    else duplicados++;

    touchedThisRun.add(id);
    if (incoming.externalId) adIdByExternal.set(norm(incoming.externalId), id);
    adIdByHash.set(hash, id);
    observacoes.push({ adId: id, importRunId: runId, coletadoEm: input.agora, resultado });
  });

  const aceitos = novos + atualizados + duplicados;
  const execucao: ImportRunRecord = {
    id: runId,
    workspaceId: IMPORT_WORKSPACE_ID,
    dataSourceId: IMPORT_SOURCE_ID,
    status: aceitos === 0 ? "falhou" : rejeitados > 0 ? "parcial" : "concluida",
    inicio: input.agora,
    fim: input.agora,
    descricao: input.arquivo,
    totais: { novos, atualizados, duplicados, erros: rejeitados },
    arquivo: input.arquivo,
    formato: input.formato,
    totalLinhas: input.linhas.length,
    avisos,
    rejeitadas,
    isDemo: false,
  };

  return {
    store: { versao: 1, anunciantes, anuncios, execucoes: [execucao, ...store.execucoes], observacoes },
    resumo: { execucao, novos, atualizados, duplicados, rejeitados },
  };
}
