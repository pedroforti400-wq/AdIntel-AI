import { FileUp } from "lucide-react";

import { DemoBadge } from "@/components/layout/demo-badge";
import type { Ad } from "@/modules/ads/types";
import { cn } from "@/lib/utils";

/** Selo para anúncios importados pelo usuário (CSV/JSON). */
export function ImportedBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-primary/30 bg-accent px-2 py-0.5 text-[11px] font-semibold tracking-wide text-accent-foreground uppercase",
        className,
      )}
    >
      <FileUp className="size-3" aria-hidden />
      Importado
    </span>
  );
}

/** Mostra de onde o anúncio veio: demonstração ou importado. */
export function SourceBadge({ ad, className }: { ad: Pick<Ad, "isDemo" | "dataSourceId">; className?: string }) {
  if (ad.isDemo) return <DemoBadge className={className} />;
  if (ad.dataSourceId === "importacao-arquivo") return <ImportedBadge className={className} />;
  return null;
}
