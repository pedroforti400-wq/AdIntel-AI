import { FlaskConical } from "lucide-react";

import { cn } from "@/lib/utils";

/** Selo que identifica dados fictícios. Deve aparecer sempre que houver dados de demonstração. */
export function DemoBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-warning/40 bg-warning/15 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-warning-foreground uppercase",
        className,
      )}
    >
      <FlaskConical className="size-3" aria-hidden />
      Demonstração
    </span>
  );
}

/** Faixa fixa no topo da área de conteúdo, avisando que os dados são fictícios. */
export function DemoBanner() {
  return (
    <div
      role="note"
      className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-warning/30 bg-warning/10 px-4 py-2 text-xs text-warning-foreground md:px-6"
    >
      <DemoBadge />
      <span>
        Os dados marcados como demonstração são <strong>fictícios</strong> e não representam pesquisas reais, empresas
        reais ou anúncios veiculados. Anúncios que você importar aparecem com o selo <strong>Importado</strong>.
      </span>
    </div>
  );
}
