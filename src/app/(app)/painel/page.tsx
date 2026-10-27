import type { Metadata } from "next";
import Link from "next/link";
import { Building2, Layers, Megaphone, Radio, Sparkles, Users } from "lucide-react";

import { ActivityRecentImports, ActivityRecentSearches } from "./sections";
import { BreakdownList } from "@/components/dashboard/breakdown-list";
import { CompetitorsTable } from "@/components/dashboard/competitors-table";
import { StatCard } from "@/components/dashboard/stat-card";
import { WeeklyChart } from "@/components/dashboard/weekly-chart";
import { DemoBadge } from "@/components/layout/demo-badge";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getRepository } from "@/data/repositories";
import {
  FORMAT_LABELS,
  PLATFORM_LABELS,
  formatChange,
  formatDate,
  formatNumber,
} from "@/lib/format";

export const metadata: Metadata = { title: "Painel" };

export default async function PainelPage() {
  const data = await getRepository().getDashboard();
  const { kpis } = data;

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Painel"
        descricao={
          <>
            Visão geral dos anúncios observados, concorrentes monitorados e atividade recente. Dados de referência
            até {formatDate(data.dataReferencia)}.
          </>
        }
        acoes={
          <>
            {data.isDemo && <DemoBadge />}
            <Button asChild variant="outline" size="sm">
              <Link href="/fontes">Ver fontes de dados</Link>
            </Button>
          </>
        }
      />

      <section aria-label="Indicadores" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 [&>*]:min-w-0">
        <StatCard
          titulo="Anúncios coletados"
          valor={formatNumber(kpis.totalAnuncios)}
          detalhe={`${formatNumber(kpis.anunciantes)} anunciantes na base`}
          icone={Megaphone}
        />
        <StatCard
          titulo="Anúncios ativos"
          valor={formatNumber(kpis.anunciosAtivos)}
          detalhe="Em veiculação na data de referência"
          icone={Radio}
        />
        <StatCard
          titulo="Novos nos últimos 7 dias"
          valor={formatNumber(kpis.novosUltimos7Dias)}
          detalhe="Comparado à semana anterior"
          icone={Sparkles}
          variacao={formatChange(kpis.novosUltimos7Dias, kpis.novosSemanaAnterior)}
        />
        <StatCard
          titulo="Concorrentes monitorados"
          valor={formatNumber(kpis.concorrentesMonitorados)}
          detalhe={`${formatNumber(kpis.pesquisasSalvas)} pesquisas salvas`}
          icone={Building2}
        />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3 [&>*]:min-w-0">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Evolução semanal</CardTitle>
            <CardDescription>Novos anúncios por semana e anúncios ativos no fim de cada semana (12 semanas).</CardDescription>
          </CardHeader>
          <CardContent>
            <WeeklyChart data={data.serieSemanal} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="size-4 text-muted-foreground" aria-hidden /> Plataformas
            </CardTitle>
            <CardDescription>Onde os anúncios ativos aparecem. Um anúncio pode estar em várias.</CardDescription>
          </CardHeader>
          <CardContent>
            <BreakdownList
              total={kpis.anunciosAtivos}
              itens={data.plataformas.map((p) => ({ rotulo: PLATFORM_LABELS[p.chave], valor: p.total }))}
            />
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3 [&>*]:min-w-0">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Concorrentes monitorados</CardTitle>
            <CardDescription>Volume de anúncios ativos hoje comparado a 4 semanas atrás.</CardDescription>
          </CardHeader>
          <CardContent>
            <CompetitorsTable rows={data.concorrentes} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="size-4 text-muted-foreground" aria-hidden /> Formatos
            </CardTitle>
            <CardDescription>Distribuição dos anúncios ativos por formato.</CardDescription>
          </CardHeader>
          <CardContent>
            <BreakdownList
              total={kpis.anunciosAtivos}
              itens={data.formatos.map((f) => ({ rotulo: FORMAT_LABELS[f.chave], valor: f.total }))}
            />
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2 [&>*]:min-w-0">
        <ActivityRecentSearches searches={data.pesquisasRecentes} />
        <ActivityRecentImports runs={data.importacoesRecentes} />
      </section>

      <p className="text-xs text-muted-foreground">
        Os indicadores acima são contagens de anúncios observados. Eles não representam investimento, alcance,
        faturamento ou vendas dos anunciantes.
      </p>
    </div>
  );
}
