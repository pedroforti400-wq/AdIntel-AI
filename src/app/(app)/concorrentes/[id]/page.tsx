import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, Building2, Clock3, Megaphone, Radio, Search, Sparkles } from "lucide-react";

import { AdGrid } from "@/components/ads/ad-grid";
import { COMPETITOR_METRICS, METRICS_DISCLAIMER } from "@/components/competitors/competitor-metrics";
import { BreakdownList } from "@/components/dashboard/breakdown-list";
import { StatCard } from "@/components/dashboard/stat-card";
import { WeeklyChart } from "@/components/dashboard/weekly-chart";
import { DemoBadge } from "@/components/layout/demo-badge";
import { EmptyState } from "@/components/shared/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getRepository } from "@/data/repositories";
import type { CompetitorProfile } from "@/data/repositories/types";
import { MIN_ADS_FOR_HISTORY } from "@/modules/competitors/stats";
import {
  FORMAT_LABELS,
  PLATFORM_LABELS,
  formatChange,
  formatDays,
  formatNumber,
} from "@/lib/format";

export const metadata: Metadata = { title: "Perfil do concorrente" };

export async function generateStaticParams() {
  const competitors = await getRepository().listCompetitors();
  return competitors.map((c) => ({ id: c.concorrente.id }));
}

export default function CompetitorPage(props: PageProps<"/concorrentes/[id]">) {
  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/concorrentes">
          <ArrowLeft /> Voltar para concorrentes
        </Link>
      </Button>
      <Suspense fallback={<ProfileSkeleton />}>
        <CompetitorProfileLoader params={props.params} />
      </Suspense>
    </div>
  );
}

async function CompetitorProfileLoader({ params }: Pick<PageProps<"/concorrentes/[id]">, "params">) {
  const { id } = await params;
  const profile = await getRepository().getCompetitor(id);
  if (!profile) notFound();
  return <CompetitorProfileView profile={profile} />;
}

function CompetitorProfileView({ profile }: { profile: CompetitorProfile }) {
  const { concorrente, estatisticas: s, historico, anuncios, dataReferencia } = profile;
  const details = COMPETITOR_METRICS.filter((m) => ["formato", "plataforma", "inicio", "coleta"].includes(m.id));
  const advertiserId = concorrente.advertiserIds[0];

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            <Building2 className="size-5" aria-hidden />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">{concorrente.nome}</h1>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="font-normal">{concorrente.nicho}</Badge>
              {concorrente.isDemo && <DemoBadge />}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/concorrentes/comparar?ids=${concorrente.id}`}>Comparar com outros</Link>
          </Button>
          {advertiserId && (
            <Button asChild size="sm">
              <Link href={`/explorar?anunciante=${advertiserId}`}>
                <Search /> Abrir no explorador
              </Link>
            </Button>
          )}
        </div>
      </div>

      <section aria-label="Indicadores" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 [&>*]:min-w-0">
        <StatCard
          titulo="Anúncios ativos"
          valor={formatNumber(s.anunciosAtivos)}
          detalhe="Comparado a 4 semanas atrás"
          icone={Radio}
          variacao={formatChange(s.anunciosAtivos, s.anunciosAtivosPeriodoAnterior)}
        />
        <StatCard
          titulo="Anúncios observados"
          valor={formatNumber(s.totalAnuncios)}
          detalhe="Ativos e encerrados"
          icone={Megaphone}
        />
        <StatCard
          titulo="Novos nos últimos 30 dias"
          valor={formatNumber(s.novosUltimos30Dias)}
          detalhe="Pela data de início"
          icone={Sparkles}
        />
        <StatCard
          titulo="Tempo médio no ar"
          valor={s.mediaDiasNoAr !== null ? formatDays(s.mediaDiasNoAr) : "—"}
          detalhe="Média entre os anúncios observados"
          icone={Clock3}
        />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3 [&>*]:min-w-0">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Histórico semanal</CardTitle>
            <CardDescription>
              Novos anúncios e anúncios ativos por semana, calculados pelas datas de início e encerramento observadas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {historico.historicoSuficiente ? (
              <WeeklyChart data={historico.serieSemanal} />
            ) : (
              <EmptyState
                titulo="Observações insuficientes"
                descricao={`São necessários pelo menos ${MIN_ADS_FOR_HISTORY} anúncios observados para montar um histórico.`}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <dl className="divide-y text-sm">
              {details.map((m) => (
                <div key={m.id} className="flex justify-between gap-3 py-2 first:pt-0">
                  <dt className="text-muted-foreground">{m.rotulo}</dt>
                  <dd className="text-right font-medium">{m.valor(s)}</dd>
                </div>
              ))}
            </dl>
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Formatos (todos os anúncios)</p>
              <BreakdownList
                total={s.totalAnuncios}
                itens={historico.formatos.map((f) => ({ rotulo: FORMAT_LABELS[f.chave], valor: f.total }))}
              />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Plataformas (um anúncio pode estar em várias)</p>
              <BreakdownList
                total={s.totalAnuncios}
                itens={historico.plataformas.map((p) => ({ rotulo: PLATFORM_LABELS[p.chave], valor: p.total }))}
              />
            </div>
          </CardContent>
        </Card>
      </section>

      <section aria-label="Anúncios associados" className="space-y-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-lg font-semibold">Anúncios associados</h2>
          <span className="text-sm text-muted-foreground">{formatNumber(anuncios.length)} anúncios · mais recentes primeiro</span>
        </div>
        <AdGrid
          views={anuncios}
          dataReferencia={dataReferencia}
          vazio={{ titulo: "Nenhum anúncio associado", descricao: "Ainda não há anúncios observados para este concorrente." }}
        />
      </section>

      <p className="text-xs text-muted-foreground">{METRICS_DISCLAIMER}</p>
    </>
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Carregando perfil">
      <Skeleton className="h-10 w-80 max-w-full" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-80 rounded-xl" />
    </div>
  );
}
