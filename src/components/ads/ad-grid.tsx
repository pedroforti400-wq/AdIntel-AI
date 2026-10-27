import type { ReactNode } from "react";

import { EmptyState } from "@/components/shared/states";
import { Skeleton } from "@/components/ui/skeleton";
import type { AdView } from "@/data/repositories/types";
import { AdCard } from "./ad-card";

export function AdGrid({
  views,
  dataReferencia,
  vazio,
}: {
  views: AdView[];
  dataReferencia: string;
  /** Conteúdo exibido quando não há anúncios. */
  vazio: { titulo: string; descricao?: ReactNode; acao?: ReactNode };
}) {
  if (views.length === 0) {
    return (
      <EmptyState titulo={vazio.titulo} descricao={vazio.descricao}>
        {vazio.acao}
      </EmptyState>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 [&>*]:min-w-0">
      {views.map((view) => (
        <li key={view.anuncio.id} className="flex">
          <div className="flex w-full [&>*]:w-full">
            <AdCard view={view} dataReferencia={dataReferencia} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function AdGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-label="Carregando anúncios">
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className="h-80 rounded-xl" />
      ))}
    </div>
  );
}
