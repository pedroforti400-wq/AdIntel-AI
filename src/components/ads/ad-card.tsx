import Link from "next/link";
import { CalendarDays, Clock3 } from "lucide-react";

import { Card } from "@/components/ui/card";
import type { AdView } from "@/data/repositories/types";
import { knownDaysRunning } from "@/modules/ads/metrics";
import { PLATFORM_LABELS, formatDate, formatDays } from "@/lib/format";
import { AdStatusBadge } from "./ad-status-badge";
import { CreativePlaceholder } from "./creative-placeholder";
import { SourceBadge } from "./source-badge";

// dataReferencia é mantida na assinatura; o tempo no ar usa as datas do próprio anúncio.
export function AdCard({ view }: { view: AdView; dataReferencia?: string }) {
  const { anuncio, anunciante } = view;
  const dias = knownDaysRunning(anuncio);

  return (
    <Card className="group relative gap-3 py-0 transition-shadow hover:shadow-md">
      <div className="px-3 pt-3">
        <CreativePlaceholder formato={anuncio.formato} titulo={anuncio.titulo} seed={anunciante.id} />
      </div>

      <div className="flex flex-1 flex-col gap-3 px-4 pb-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{anunciante.nome}</p>
            <p className="text-xs text-muted-foreground">{anunciante.nicho}</p>
          </div>
          <AdStatusBadge ativo={anuncio.ativo} className="shrink-0" />
        </div>

        <p className="line-clamp-3 text-sm text-muted-foreground">
          {anuncio.texto ?? <span className="italic">Texto não disponível nesta fonte</span>}
        </p>

        <div className="mt-auto space-y-2 text-xs text-muted-foreground">
          <div className="flex flex-wrap gap-1">
            {anuncio.plataformas.map((p) => (
              <span key={p} className="rounded-md bg-muted px-1.5 py-0.5">
                {PLATFORM_LABELS[p]}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="size-3.5" aria-hidden />
              {anuncio.dataInicio ? `Início ${formatDate(anuncio.dataInicio)}` : "Início não informado"}
            </span>
            {dias !== null && (
              <span className="inline-flex items-center gap-1">
                <Clock3 className="size-3.5" aria-hidden />
                {formatDays(dias)} no ar
              </span>
            )}
          </div>
          <div className="flex items-center justify-between pt-1">
            <SourceBadge ad={anuncio} />
            {/* O link cobre o cartão inteiro (after:inset-0) para facilitar o clique. */}
            <Link
              href={`/biblioteca/${anuncio.id}`}
              className="text-xs font-medium text-primary after:absolute after:inset-0 hover:underline"
            >
              Ver detalhes<span className="sr-only"> do anúncio de {anunciante.nome}</span>
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
}
