import { formatNumber } from "@/lib/format";

/** Lista com barras horizontais, para distribuições simples (plataforma, formato). */
export function BreakdownList({
  itens,
  total,
}: {
  itens: { rotulo: string; valor: number }[];
  /** Base para o percentual de cada barra. */
  total: number;
}) {
  return (
    <ul className="space-y-3">
      {itens.map((item, index) => {
        const pct = total > 0 ? Math.round((item.valor / total) * 100) : 0;
        return (
          <li key={item.rotulo} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span>{item.rotulo}</span>
              <span className="text-muted-foreground tabular-nums">
                {formatNumber(item.valor)} <span className="text-xs">({pct}%)</span>
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full"
                style={{ width: `${pct}%`, backgroundColor: `var(--chart-${(index % 5) + 1})` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
