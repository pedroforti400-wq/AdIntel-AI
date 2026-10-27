import "server-only";

import { combinedRepository } from "./combined";
import type { Repository } from "./types";

/**
 * Escolhe qual implementação de dados usar.
 * Hoje: dados de demonstração + anúncios importados guardados localmente.
 * Na Fase 4 este é o único lugar que muda para passar a usar o Supabase.
 */
export function getRepository(): Repository {
  return combinedRepository;
}

export { importedCounts, listImportRuns } from "./combined";
export type * from "./types";
