import "server-only";

import { applyImport, type ImportSummary } from "@/modules/imports/engine";
import { IMPORT_LIMITS, formatFromFileName, sanitizeFileName } from "@/modules/imports/limits";
import { mappingErrors, sanitizeMapping } from "@/modules/imports/mapping";
import { parseImportFile } from "@/modules/imports/parse";
import { loadStore, saveStore, withStoreLock } from "./file-store";

export type ImportServiceResult = { ok: true; resumo: ImportSummary } | { ok: false; erro: string };

/**
 * Importação definitiva, feita no servidor. Não confia no navegador:
 * valida de novo o tipo, o tamanho, a estrutura e o mapeamento antes de gravar.
 */
export async function importFile(input: {
  nomeArquivo: string;
  tamanho: number;
  texto: string;
  mapeamento: unknown;
  agora?: Date;
}): Promise<ImportServiceResult> {
  const arquivo = sanitizeFileName(input.nomeArquivo);
  const formato = formatFromFileName(arquivo);
  if (!formato) return { ok: false, erro: "Formato não aceito. Envie um arquivo .csv ou .json." };
  if (input.tamanho > IMPORT_LIMITS.maxBytes) {
    return { ok: false, erro: "O arquivo passa do limite de 2 MB." };
  }

  const parsed = parseImportFile(input.texto, formato);
  if (!parsed.ok) return { ok: false, erro: parsed.erro };

  const mapeamento = sanitizeMapping(input.mapeamento, parsed.tabela.colunas);
  const errors = mappingErrors(mapeamento);
  if (errors.length > 0) return { ok: false, erro: errors.join(" ") };

  return withStoreLock(async () => {
    const store = await loadStore();
    const { store: updated, resumo } = applyImport(store, {
      arquivo,
      formato,
      linhas: parsed.tabela.linhas,
      mapeamento,
      agora: (input.agora ?? new Date()).toISOString(),
    });
    await saveStore(updated);
    return { ok: true as const, resumo };
  });
}
