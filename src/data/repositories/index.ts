import "server-only";

import { demoRepository } from "@/data/demo/repository";
import type { Repository } from "./types";

/**
 * Escolhe qual implementação de dados usar.
 * Nesta fase só existe a de demonstração. Na Fase 4 este é o único lugar
 * que muda para passar a usar o Supabase.
 */
export function getRepository(): Repository {
  return demoRepository;
}

export type * from "./types";
