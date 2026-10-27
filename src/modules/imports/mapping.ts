import { normalizeText } from "@/modules/ads/search";

/**
 * Campos do AdIntel AI que podem receber colunas do arquivo importado.
 */
export const TARGET_FIELDS = [
  "anunciante",
  "id_pagina",
  "nicho",
  "id_externo",
  "texto",
  "titulo",
  "cta",
  "link_destino",
  "formato",
  "plataformas",
  "paises",
  "data_inicio",
  "data_fim",
  "status",
] as const;

export type TargetField = (typeof TARGET_FIELDS)[number];

/** Para cada campo do sistema, o nome da coluna do arquivo (ou "" se não houver). */
export type ColumnMapping = Record<TargetField, string>;

export const TARGET_FIELD_INFO: Record<TargetField, { rotulo: string; dica: string; obrigatorio?: boolean }> = {
  anunciante: { rotulo: "Anunciante", dica: "Nome da página ou empresa que anuncia.", obrigatorio: true },
  id_pagina: { rotulo: "ID da página", dica: "Identificador do anunciante na fonte (opcional)." },
  nicho: { rotulo: "Nicho", dica: "Segmento do anunciante, ex.: Moda." },
  id_externo: { rotulo: "ID do anúncio", dica: "Identificador único na fonte. Ajuda a evitar duplicados." },
  texto: { rotulo: "Texto do anúncio", dica: "Texto principal (copy)." },
  titulo: { rotulo: "Título", dica: "Título ou headline." },
  cta: { rotulo: "Chamada para ação (CTA)", dica: "Ex.: Saiba mais, Comprar agora." },
  link_destino: { rotulo: "Link de destino", dica: "Somente endereços http:// ou https://." },
  formato: { rotulo: "Formato", dica: "Imagem, vídeo, carrossel ou texto." },
  plataformas: { rotulo: "Plataformas", dica: "Facebook, Instagram, Messenger, Audience Network (separadas por vírgula)." },
  paises: { rotulo: "Países", dica: "Códigos de 2 letras, ex.: BR, PT." },
  data_inicio: { rotulo: "Data de início", dica: "AAAA-MM-DD ou DD/MM/AAAA." },
  data_fim: { rotulo: "Data de encerramento", dica: "AAAA-MM-DD ou DD/MM/AAAA." },
  status: { rotulo: "Situação", dica: "Ativo/encerrado (também aceita active/inactive, sim/não)." },
};

/** Nomes de coluna comuns para cada campo, usados na sugestão automática. */
const SYNONYMS: Record<TargetField, string[]> = {
  anunciante: ["anunciante", "advertiser", "page name", "page_name", "nome da pagina", "pagina", "empresa", "marca", "brand"],
  id_pagina: ["id pagina", "id_pagina", "page id", "page_id"],
  nicho: ["nicho", "segmento", "categoria", "niche", "category"],
  id_externo: ["id anuncio", "id_anuncio", "ad id", "ad_id", "id externo", "id_externo", "ad_archive_id", "id"],
  texto: ["texto", "copy", "texto do anuncio", "ad text", "body", "ad_creative_body", "mensagem", "descricao"],
  titulo: ["titulo", "title", "headline", "ad_creative_link_title"],
  cta: ["cta", "chamada", "call to action", "call_to_action", "botao"],
  link_destino: ["link", "link destino", "link_destino", "url", "landing page", "destino", "ad_snapshot_url"],
  formato: ["formato", "format", "tipo", "type", "media type"],
  plataformas: ["plataformas", "plataforma", "platforms", "platform", "publisher_platforms", "veiculacao"],
  paises: ["paises", "pais", "country", "countries"],
  data_inicio: ["data inicio", "data_inicio", "inicio", "start date", "start_date", "ad_delivery_start_time", "data de inicio"],
  data_fim: ["data fim", "data_fim", "fim", "end date", "end_date", "ad_delivery_stop_time", "data de encerramento"],
  status: ["status", "situacao", "ativo", "active"],
};

function key(name: string): string {
  return normalizeText(name).replace(/[_\-.]+/g, " ").replace(/\s+/g, " ").trim();
}

export function emptyMapping(): ColumnMapping {
  return Object.fromEntries(TARGET_FIELDS.map((f) => [f, ""])) as ColumnMapping;
}

/** Sugere o mapeamento comparando os nomes das colunas com nomes conhecidos. Cada coluna é usada uma vez. */
export function suggestMapping(columns: string[]): ColumnMapping {
  const mapping = emptyMapping();
  const used = new Set<string>();
  for (const field of TARGET_FIELDS) {
    const synonyms = SYNONYMS[field].map(key);
    const match = columns.find((c) => !used.has(c) && synonyms.includes(key(c)));
    if (match) {
      mapping[field] = match;
      used.add(match);
    }
  }
  return mapping;
}

/** Aceita um mapeamento vindo do navegador, descartando colunas que não existem no arquivo. */
export function sanitizeMapping(raw: unknown, columns: string[]): ColumnMapping {
  const mapping = emptyMapping();
  if (!raw || typeof raw !== "object") return mapping;
  for (const field of TARGET_FIELDS) {
    const value = (raw as Record<string, unknown>)[field];
    if (typeof value === "string" && columns.includes(value)) mapping[field] = value;
  }
  return mapping;
}

export function mappingErrors(mapping: ColumnMapping): string[] {
  const errors: string[] = [];
  if (!mapping.anunciante) errors.push("Escolha qual coluna contém o anunciante.");
  if (!mapping.texto && !mapping.titulo && !mapping.link_destino && !mapping.id_externo) {
    errors.push("Escolha ao menos uma coluna de texto, título, link ou ID do anúncio.");
  }
  return errors;
}
