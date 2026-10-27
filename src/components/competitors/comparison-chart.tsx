"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { WeeklyPoint } from "@/modules/ads/metrics";
import { formatDate } from "@/lib/format";

/** Anúncios ativos por semana, uma linha por concorrente. */
export function ComparisonChart({ series }: { series: { id: string; nome: string; pontos: WeeklyPoint[] }[] }) {
  const config: ChartConfig = Object.fromEntries(
    series.map((s, i) => [s.id, { label: s.nome, color: `var(--chart-${(i % 5) + 1})` }]),
  );

  const rows = (series[0]?.pontos ?? []).map((p, i) => ({
    rotulo: formatDate(p.semana, { year: undefined }),
    ...Object.fromEntries(series.map((s) => [s.id, s.pontos[i]?.ativos ?? 0])),
  }));

  return (
    <ChartContainer config={config} className="aspect-auto h-[280px] w-full">
      <LineChart data={rows} margin={{ left: -16, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="rotulo" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} />
        <YAxis tickLine={false} axisLine={false} width={40} allowDecimals={false} />
        <ChartTooltip content={<ChartTooltipContent labelFormatter={(v) => `Semana de ${v}`} />} />
        {series.map((s) => (
          <Line key={s.id} dataKey={s.id} type="monotone" stroke={`var(--color-${s.id})`} strokeWidth={2} dot={false} />
        ))}
        <ChartLegend content={<ChartLegendContent />} />
      </LineChart>
    </ChartContainer>
  );
}
