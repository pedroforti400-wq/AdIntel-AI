/**
 * Limites de segurança da importação. Arquivos acima disso são recusados
 * com uma mensagem clara, em vez de travar o sistema.
 */
export const IMPORT_LIMITS = {
  /** Tamanho máximo do arquivo: 2 MB. */
  maxBytes: 2 * 1024 * 1024,
  maxRows: 5000,
  maxColumns: 100,
  /** Tamanho máximo de uma célula (caracteres). */
  maxCellLength: 10_000,
  /** Máximo de anúncios importados guardados localmente. */
  maxStoredAds: 20_000,
} as const;

export const ACCEPTED_EXTENSIONS = [".csv", ".json"] as const;
export type ImportFormat = "csv" | "json";

export function formatFromFileName(name: string): ImportFormat | null {
  const lower = name.toLowerCase();
  if (lower.endsWith(".csv")) return "csv";
  if (lower.endsWith(".json")) return "json";
  return null;
}

/** Mantém só o nome do arquivo (sem pastas), sem caracteres de controle e com tamanho limitado. */
export function sanitizeFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "arquivo";
  const clean = base.replace(/[\u0000-\u001f\u007f]/g, "").trim();
  return (clean || "arquivo").slice(0, 120);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}
