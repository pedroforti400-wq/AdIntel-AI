import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { GitCompareArrows } from "lucide-react";

import { COMPETITOR_METRICS, METRICS_DISCLAIMER } from "@/components/competitors/competitor-metrics";
import { DemoBadge } from "@/components/layout/demo-badge";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRepository } from "@/data/repositories";

export const metadata: Metadata = { title: "Concorrentes" };

const CARD_METRICS = COMPETITOR_METRICS.filter((m) => ["ativos", "variacao", "novos", "media"].includes(m.id));

export default async function ConcorrentesPage() {
  const competitors = await getRepository().listCompetitors();

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Concorrentes"
        descricao="Acompanhe os concorrentes monitorados, veja o perfil de cada um e compare até 4 lado a lado."
        acoes={<DemoBadge />}
      />

      {competitors.length === 0 ? (
        <EmptyState
          titulo="Nenhum concorrente monitorado"
          descricao="O cadastro de concorrentes será liberado junto com o banco de dados (Fase 4)."
        />
      ) : (
        <Form action="/concorrentes/comparar" className="space-y-4">
          <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Marque de <strong className="text-foreground">2 a 4</strong> concorrentes e clique em comparar.
            </p>
            <Button type="submit">
              <GitCompareArrows /> Comparar selecionados
            </Button>
          </div>

          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 [&>*]:min-w-0">
            {competitors.map(({ concorrente, estatisticas }) => (
              <li key={concorrente.id} className="flex">
                <Card className="w-full gap-4">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <CardTitle className="truncate text-base">{concorrente.nome}</CardTitle>
                        <Badge variant="secondary" className="font-normal">{concorrente.nicho}</Badge>
                      </div>
                      <label className="flex shrink-0 cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
                        <input
                          type="checkbox"
                          name="ids"
                          value={concorrente.id}
                          className="size-4 cursor-pointer accent-primary"
                        />
                        Comparar
                      </label>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col gap-4">
                    <dl className="grid grid-cols-2 gap-3">
                      {CARD_METRICS.map((m) => (
                        <div key={m.id} className="rounded-lg bg-muted/60 px-3 py-2">
                          <dt className="text-[11px] text-muted-foreground">{m.rotulo}</dt>
                          <dd className="text-lg font-semibold tabular-nums">{m.valor(estatisticas)}</dd>
                        </div>
                      ))}
                    </dl>
                    <Button asChild variant="outline" size="sm" className="mt-auto">
                      <Link href={`/concorrentes/${concorrente.id}`}>Ver perfil completo</Link>
                    </Button>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </Form>
      )}

      <p className="text-xs text-muted-foreground">{METRICS_DISCLAIMER}</p>
    </div>
  );
}
