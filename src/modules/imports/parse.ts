import { IMPORT_LIMITS, type ImportFormat } from "./limits";

/**
 * Leitura de arquivos CSV e JSON.
 *
 * Segurança: o conteúdo é tratado apenas como texto. Nada é executado
 * (sem eval, sem fórmulas). Funciona igual no navegador (pré-visualização)
 * e no servidor (importação definitiva, que revalida tudo).
 */

export type RawRecord = Record<string, string>;

export interface ParsedTable {
  colunas: string[];
  linhas: RawRecord[];
}

export type ParseResult = { ok: true; tabela: ParsedTable } | { ok: false; erro: string };

const fail = (erro: string): ParseResult => ({ ok: false, erro });

/** Remove a marca BOM que alguns programas (como o Excel) colocam no início do arquivo. */
function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

/** Descobre o separador olhando a primeira linha: vírgula, ponto e vírgula ou tabulação. */
export function detectDelimiter(text: string): string {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  let inQuotes = false;
  const counts: Record<string, number> = { ",": 0, ";": 0, "\t": 0 };
  for (const ch of firstLine) {
    if (ch === '"') inQuotes = !inQuotes;
    else if (!inQuotes && ch in counts) counts[ch]++;
  }
  const [best, count] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return count > 0 ? best : ",";
}

/** Lê CSV seguindo as regras comuns: campos entre aspas, aspas duplicadas ("") e quebras de linha dentro de aspas. */
export function parseCsvRows(text: string, delimiter: string): string[][] | { erro: string } {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
      } else {
        field += ch;
      }
      i++;
      continue;
    }
    if (ch === '"' && field === "") {
      inQuotes = true;
    } else if (ch === delimiter) {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      if (ch === "\r" && text[i + 1] === "\n") i++;
    } else {
      field += ch;
    }
    i++;
    if (rows.length > IMPORT_LIMITS.maxRows + 1) {
      return { erro: `O arquivo tem mais de ${IMPORT_LIMITS.maxRows} linhas. Divida-o em arquivos menores.` };
    }
  }

  if (inQuotes) return { erro: "O arquivo CSV tem aspas abertas que não foram fechadas." };
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  // Ignora linhas totalmente vazias.
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

/** Garante nomes de coluna únicos e não vazios ("preco", "preco_2"…). */
function uniqueHeaders(headers: string[]): string[] {
  const seen = new Map<string, number>();
  const result: string[] = [];
  for (const [index, raw] of headers.entries()) {
    let name = raw.trim() || `coluna_${index + 1}`;
    const count = seen.get(name) ?? 0;
    seen.set(name, count + 1);
    if (count > 0) name = `${name}_${count + 1}`;
    result.push(name);
  }
  return result;
}

function checkTable(colunas: string[], linhas: RawRecord[]): ParseResult {
  if (colunas.length === 0) return fail("Não foi encontrada nenhuma coluna no arquivo.");
  if (colunas.length > IMPORT_LIMITS.maxColumns) {
    return fail(`O arquivo tem ${colunas.length} colunas; o máximo é ${IMPORT_LIMITS.maxColumns}.`);
  }
  if (linhas.length === 0) return fail("O arquivo não tem nenhuma linha de dados.");
  if (linhas.length > IMPORT_LIMITS.maxRows) {
    return fail(`O arquivo tem ${linhas.length} linhas; o máximo é ${IMPORT_LIMITS.maxRows}.`);
  }
  return { ok: true, tabela: { colunas, linhas } };
}

export function parseCsv(text: string): ParseResult {
  const clean = stripBom(text);
  if (!clean.trim()) return fail("O arquivo está vazio.");
  const rows = parseCsvRows(clean, detectDelimiter(clean));
  if ("erro" in rows) return fail(rows.erro);
  const [header, ...data] = rows;
  if (!header) return fail("O arquivo está vazio.");
  const colunas = uniqueHeaders(header);
  const linhas = data.map((cells) =>
    Object.fromEntries(colunas.map((col, i) => [col, cells[i] ?? ""])),
  );
  return checkTable(colunas, linhas);
}

/** Converte um valor JSON em texto. Listas simples viram "a, b"; objetos aninhados são ignorados. */
function jsonValueToText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value) && value.every((v) => ["string", "number", "boolean"].includes(typeof v))) {
    return value.join(", ");
  }
  return "";
}

export function parseJson(text: string): ParseResult {
  const clean = stripBom(text);
  if (!clean.trim()) return fail("O arquivo está vazio.");
  let data: unknown;
  try {
    data = JSON.parse(clean);
  } catch {
    return fail("O arquivo JSON não é válido. Verifique vírgulas, aspas e chaves.");
  }

  // Aceita uma lista direta ou um objeto com a lista em "anuncios", "ads" ou "data".
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const wrapper = data as Record<string, unknown>;
    data = wrapper.anuncios ?? wrapper.ads ?? wrapper.data;
  }
  if (!Array.isArray(data)) {
    return fail('O JSON precisa ser uma lista de anúncios, ou um objeto com a lista em "anuncios".');
  }
  if (data.length > IMPORT_LIMITS.maxRows) {
    return fail(`O arquivo tem ${data.length} itens; o máximo é ${IMPORT_LIMITS.maxRows}.`);
  }

  const objects = data.filter((item): item is Record<string, unknown> => !!item && typeof item === "object" && !Array.isArray(item));
  if (objects.length === 0) return fail("A lista do JSON não contém nenhum anúncio (objeto).");

  const colunas: string[] = [];
  for (const obj of objects) {
    for (const key of Object.keys(obj)) {
      if (!colunas.includes(key)) colunas.push(key);
      if (colunas.length > IMPORT_LIMITS.maxColumns) {
        return fail(`O arquivo tem mais de ${IMPORT_LIMITS.maxColumns} campos diferentes.`);
      }
    }
  }
  const linhas = objects.map((obj) => Object.fromEntries(colunas.map((c) => [c, jsonValueToText(obj[c])])));
  return checkTable(colunas, linhas);
}

export function parseImportFile(text: string, format: ImportFormat): ParseResult {
  return format === "csv" ? parseCsv(text) : parseJson(text);
}
