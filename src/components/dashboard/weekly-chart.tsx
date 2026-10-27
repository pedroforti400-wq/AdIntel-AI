"use client";

import { Area, AreaChart, CartesianGrid, Line, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { WeeklyPoint } from "@/data/repositories/types";
import { formatDate } from "@/lib/format";

const chartConfig = {
  novos: { label: "Novos anúncios", color: "var(--chart-1)" },
  ativos: { label: "Ativos no fim da semana", color: "var(--chart-2)" },
} satisfies ChartConfig;

export function WeeklyChart({ data }: { data: WeeklyPoint[] }) {
  const rows = data.map((p) => ({ ...p, rotulo: formatDate(p.semana, { year: undefined }) }));

  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-[260px] w-full">
      <AreaChart data={rows} margin={{ left: -16, right: 8, top: 8 }}>
        <defs>
          <linearGradient id="fill-novos" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-novos)" stopOpacity={0.35} />
            <stop offset="95%" stopColor="var(--color-novos)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="rotulo" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} />
        <YAxis tickLine={false} axisLine={false} width={40} allowDecimals={false} />
        <ChartTooltip content={<ChartTooltipContent labelFormatter={(v) => `Semana de ${v}`} />} />
        <Area
          dataKey="novos"
          type="monotone"
          stroke="var(--color-novos)"
          strokeWidth={2}
          fill="url(#fill-novos)"
        />
        <Line dataKey="ativos" type="monotone" stroke="var(--color-ativos)" strokeWidth={2} dot={false} />
        <ChartLegend content={<ChartLegendContent />} />
      </AreaChart>
    </ChartContainer>
  );
}
