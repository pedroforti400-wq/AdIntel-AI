import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  titulo,
  valor,
  detalhe,
  icone: Icon,
  variacao,
}: {
  titulo: string;
  valor: string;
  detalhe: string;
  icone: LucideIcon;
  /** Texto de variação, ex.: "+12%". Positivo/negativo define a cor. */
  variacao?: string | null;
}) {
  const negativa = variacao?.startsWith("-");

  return (
    <Card className="gap-0 py-0">
      <CardContent className="flex flex-col gap-3 p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">{titulo}</span>
          <div className="flex size-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <Icon className="size-4" aria-hidden />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-semibold tracking-tight tabular-nums">{valor}</span>
          {variacao && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 text-xs font-medium",
                negativa ? "text-destructive" : "text-success",
              )}
            >
              {negativa ? <TrendingDown className="size-3" /> : <TrendingUp className="size-3" />}
              {variacao}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{detalhe}</p>
      </CardContent>
    </Card>
  );
}
