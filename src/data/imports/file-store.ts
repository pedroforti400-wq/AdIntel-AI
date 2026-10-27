import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import { emptyStore, type ImportStore } from "@/modules/imports/engine";

/**
 * Armazenamento local dos anúncios importados (até o Supabase chegar, na Fase 4).
 *
 * - Fica em ".dados-locais/importacoes.json", pasta ignorada pelo Git (nunca vai ao GitHub).
 * - Só o servidor lê e grava este arquivo.
 * - A gravação é "atômica": escreve um arquivo temporário e depois o renomeia,
 *   para não corromper os dados se algo falhar no meio.
 * - Se o arquivo estiver danificado, ele é guardado com outro nome e o sistema segue funcionando.
 */

const FILE_NAME = "importacoes.json";

export function dataDir(): string {
  return process.env.ADINTEL_DATA_DIR ?? path.join(/* turbopackIgnore: true */ process.cwd(), ".dados-locais");
}

function storePath(dir: string) {
  return path.join(dir, FILE_NAME);
}

function isValidStore(value: unknown): value is ImportStore {
  if (!value || typeof value !== "object") return false;
  const s = value as Partial<ImportStore>;
  return (
    s.versao === 1 &&
    Array.isArray(s.anunciantes) &&
    Array.isArray(s.anuncios) &&
    Array.isArray(s.execucoes) &&
    Array.isArray(s.observacoes)
  );
}

export async function loadStore(dir = dataDir()): Promise<ImportStore> {
  let text: string;
  try {
    text = await readFile(storePath(dir), "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return emptyStore();
    throw error;
  }

  try {
    const parsed: unknown = JSON.parse(text);
    if (isValidStore(parsed)) return parsed;
  } catch {
    // tratado abaixo
  }

  // Arquivo danificado: preserva uma cópia para análise e recomeça vazio.
  const backup = path.join(dir, `importacoes.corrompido-${Date.now()}.json`);
  await rename(storePath(dir), backup).catch(() => undefined);
  console.warn(`[AdIntel] Arquivo de importações inválido. Cópia guardada em ${backup}.`);
  return emptyStore();
}

export async function saveStore(store: ImportStore, dir = dataDir()): Promise<void> {
  await mkdir(dir, { recursive: true });
  const target = storePath(dir);
  const temp = `${target}.${process.pid}.tmp`;
  await writeFile(temp, JSON.stringify(store), "utf8");
  await rename(temp, target);
}

// Fila simples: garante que duas importações ao mesmo tempo não sobrescrevam uma à outra.
let queue: Promise<unknown> = Promise.resolve();

export function withStoreLock<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task);
  queue = run.catch(() => undefined);
  return run;
}
