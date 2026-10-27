import { Bookmark, CheckCircle2, CircleAlert, Clock3, XCircle } from "lucide-react";

import { EmptyState } from "@/components/shared/states";
import type { ImportRun, Search } from "@/modules/ads/types";
import { IMPORT_STATUS_LABELS, formatDateTime, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

export function RecentSearches({ searches }: { searches: Search[] }) {
  if (searches.length === 0) {
    return <EmptyState titulo="Nenhuma pesquisa ainda" descricao="Suas pesquisas aparecerão aqui." />;
  }

  return (
    <ul className="divide-y">
      {searches.map((s) => (
        <li key={s.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 truncate text-sm font-medium">
              “{s.termos}”
              {s.salva && <Bookmark className="size-3.5 fill-primary text-primary" aria-label="Pesquisa salva" />}
            </p>
            <p className="text-xs text-muted-foreground">
              {s.nicho ?? "Sem nicho"} · {formatDateTime(s.ultimaExecucao)}
            </p>
          </div>
          <span className="text-sm text-muted-foreground tabular-nums">{formatNumber(s.totalResultados)} anúncios</span>
        </li>
      ))}
    </ul>
  );
}

const STATUS_ICON = {
  concluida: { icon: CheckCircle2, className: "text-success" },
  parcial: { icon: CircleAlert, className: "text-warning-foreground" },
  falhou: { icon: XCircle, className: "text-destructive" },
  em_andamento: { icon: Clock3, className: "text-muted-foreground" },
} as const;

export function RecentImports({ runs }: { runs: ImportRun[] }) {
  if (runs.length === 0) {
    return <EmptyState titulo="Nenhuma importação ainda" descricao="As execuções de importação aparecerão aqui." />;
  }

  return (
    <ul className="divide-y">
      {runs.map((run) => {
        const status = STATUS_ICON[run.status];
        const Icon = status.icon;
        return (
          <li key={run.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
            <Icon className={cn("mt-0.5 size-4 shrink-0", status.className)} aria-hidden />
            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <p className="text-sm font-medium">{run.descricao}</p>
                <p className="text-xs text-muted-foreground">
                  {IMPORT_STATUS_LABELS[run.status]} · {formatDateTime(run.inicio)}
                </p>
              </div>
              <p className="text-xs text-muted-foreground tabular-nums">
                <span className="font-medium text-foreground">{run.totais.novos}</span> novos ·{" "}
                {run.totais.atualizados} atualizados · {run.totais.duplicados} duplicados
                {run.totais.erros > 0 && <span className="text-destructive"> · {run.totais.erros} erros</span>}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
