import { importFile } from "@/data/imports/service";
import { IMPORT_LIMITS } from "@/modules/imports/limits";

/**
 * Recebe o arquivo enviado pela página de Importações.
 * Corpo: formulário (multipart) com "arquivo" e "mapeamento" (JSON).
 */

// Margem para o envelope do formulário além do próprio arquivo.
const MAX_BODY_BYTES = IMPORT_LIMITS.maxBytes + 256 * 1024;

function error(status: number, erro: string) {
  return Response.json({ ok: false, erro }, { status });
}

export async function POST(request: Request) {
  // Só aceita envios vindos do próprio AdIntel AI (bloqueia outros sites).
  const origin = request.headers.get("origin");
  if (origin) {
    let host: string | null = null;
    try {
      host = new URL(origin).host;
    } catch {
      // origem inválida ("null", por exemplo): tratada como outro site
    }
    if (host !== request.headers.get("host")) return error(403, "Envio não permitido a partir de outro site.");
  }

  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_BODY_BYTES) return error(413, "O arquivo passa do limite de 2 MB.");

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return error(400, "Não foi possível ler o envio. Tente selecionar o arquivo novamente.");
  }

  const file = form.get("arquivo");
  if (!(file instanceof File)) return error(400, "Nenhum arquivo foi enviado.");
  if (file.size > IMPORT_LIMITS.maxBytes) return error(413, "O arquivo passa do limite de 2 MB.");

  let mapeamento: unknown = null;
  try {
    mapeamento = JSON.parse(String(form.get("mapeamento") ?? "null"));
  } catch {
    return error(400, "O mapeamento de colunas é inválido.");
  }

  try {
    const result = await importFile({
      nomeArquivo: file.name,
      tamanho: file.size,
      texto: await file.text(),
      mapeamento,
    });
    return result.ok ? Response.json(result) : error(422, result.erro);
  } catch (e) {
    // Não devolve detalhes internos ao navegador; registra só no terminal do servidor.
    console.error("[AdIntel] Falha ao importar:", e instanceof Error ? e.message : e);
    return error(500, "Ocorreu um erro inesperado ao salvar a importação. Nada foi alterado.");
  }
}
