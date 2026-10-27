import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft, GitCompareArrows } from "lucide-react";

import { ComparisonChart } from "@/components/competitors/comparison-chart";
import { COMPETITOR_METRICS, METRICS_DISCLAIMER } from "@/components/competitors/competitor-metrics";
import { DemoBadge } from "@/components/layout/demo-badge";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getRepository } from "@/data/repositories";
import { normalizeComparisonIds } from "@/modules/competitors/stats";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Comparar concorrentes" };

export default function CompararPage(props: PageProps<"/concorrentes/comparar">) {
  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/concorrentes">
          <ArrowLeft /> Voltar para concorrentes
        </Link>
      </Button>
      <PageHeader
        titulo="Comparar concorrentes"
        descricao="Métricas e histórico de anúncios ativos lado a lado."
        acoes={<DemoBadge />}
      />
      <Suspense fallback={<Skeleton className="h-96 rounded-xl" />}>
        <Comparison searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

async function Comparison({ searchParams }: Pick<PageProps<"/concorrentes/comparar">, "searchParams">) {
  const { ids: rawIds } = await searchParams;
  const repo = getRepository();
  const all = await repo.listCompetitors();
  const ids = normalizeComparisonIds(rawIds, all.map((c) => c.concorrente.id));
  const profiles = ids.length >= 2 ? await repo.getCompetitors(ids) : [];

  return (
    <>
      {/* Seletor: permite ajustar a comparação sem voltar à lista. */}
      <Card className="py-0" key={ids.join(",")}>
        <CardContent className="p-4">
          <Form action="/concorrentes/comparar" className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <fieldset className="flex flex-1 flex-wrap gap-x-4 gap-y-2">
              <legend className="sr-only">Concorrentes para comparar</legend>
              {all.map(({ concorrente }) => (
                <label key={concorrente.id} className="flex cursor-pointer items-center gap-1.5 text-sm">
                  <input
                    type="checkbox"
                    name="ids"
                    value={concorrente.id}
                    defaultChecked={ids.includes(concorrente.id)}
                    className="size-4 cursor-pointer accent-primary"
                  />
                  {concorrente.nome}
                </label>
              ))}
            </fieldset>
            <Button type="submit" size="sm">
              <GitCompareArrows /> Atualizar comparação
            </Button>
          </Form>
        </CardContent>
      </Card>

      {profiles.length < 2 ? (
        <EmptyState
          titulo="Selecione pelo menos 2 concorrentes"
          descricao="Marque de 2 a 4 concorrentes acima e clique em “Atualizar comparação”."
        />
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Métricas lado a lado</CardTitle>
              <CardDescription>O maior valor de cada linha numérica aparece em destaque.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Métrica</TableHead>
                    {profiles.map((p) => (
                      <TableHead key={p.concorrente.id} className="text-right">
                        <Link href={`/concorrentes/${p.concorrente.id}`} className="hover:underline">
                          {p.concorrente.nome}
                        </Link>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {COMPETITOR_METRICS.map((m) => {
                    const numbers = m.numero ? profiles.map((p) => m.numero!(p.estatisticas)) : [];
                    const max = numbers.length ? Math.max(...numbers.map((n) => n ?? -Infinity)) : null;
                    return (
                      <TableRow key={m.id}>
                        <TableCell className="text-muted-foreground">{m.rotulo}</TableCell>
                        {profiles.map((p, i) => (
                          <TableCell
                            key={p.concorrente.id}
                            className={cn(
                              "text-right tabular-nums",
                              max !== null && numbers[i] === max && "font-semibold text-primary",
                            )}
                          >
                            {m.valor(p.estatisticas)}
                          </TableCell>
                        ))}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Anúncios ativos por semana</CardTitle>
              <CardDescription>
                Histórico demonstrativo de 12 semanas, calculado pelas datas de início e encerramento observadas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ComparisonChart
                series={profiles.map((p) => ({
                  id: p.concorrente.id,
                  nome: p.concorrente.nome,
                  pontos: p.historico.serieSemanal,
                }))}
              />
            </CardContent>
          </Card>
        </>
      )}

      <p className="text-xs text-muted-foreground">{METRICS_DISCLAIMER}</p>
    </>
  );
}
