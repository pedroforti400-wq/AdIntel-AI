import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, ExternalLink, Info } from "lucide-react";

import { AdStatusBadge } from "@/components/ads/ad-status-badge";
import { CreativePlaceholder } from "@/components/ads/creative-placeholder";
import { FieldAvailabilityList } from "@/components/ads/field-availability";
import { SourceBadge } from "@/components/ads/source-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getRepository } from "@/data/repositories";
import type { AdView } from "@/data/repositories/types";
import { knownDaysRunning } from "@/modules/ads/metrics";
import { FORMAT_LABELS, PLATFORM_LABELS, formatDate, formatDays } from "@/lib/format";

export const metadata: Metadata = { title: "Detalhes do anúncio" };

export async function generateStaticParams() {
  const ids = await getRepository().listAdIds();
  return ids.map((id) => ({ id }));
}

export default function AdDetailPage(props: PageProps<"/biblioteca/[id]">) {
  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/biblioteca">
          <ArrowLeft /> Voltar para a biblioteca
        </Link>
      </Button>
      <Suspense fallback={<DetailSkeleton />}>
        <AdDetail params={props.params} />
      </Suspense>
    </div>
  );
}

async function AdDetail({ params }: Pick<PageProps<"/biblioteca/[id]">, "params">) {
  const { id } = await params;
  const view = await getRepository().getAd(id);
  if (!view) notFound();
  return <AdDetailContent view={view} />;
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-3 py-2 text-sm first:pt-0 last:pb-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  );
}

function Unavailable({ children = "Não disponível nesta fonte" }: { children?: React.ReactNode }) {
  return <span className="text-muted-foreground italic">{children}</span>;
}

function AdDetailContent({ view }: { view: AdView }) {
  const { anuncio, anunciante, fonte, concorrenteId } = view;
  const dias = knownDaysRunning(anuncio);

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{anuncio.titulo ?? "Anúncio sem título"}</h1>
          <p className="text-sm text-muted-foreground">
            {anunciante.nome} · {anunciante.nicho}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AdStatusBadge ativo={anuncio.ativo} />
          <SourceBadge ad={anuncio} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5 [&>*]:min-w-0">
        <div className="space-y-4 lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Texto publicitário</CardTitle>
              <CardDescription>Conteúdo do anúncio exatamente como registrado na fonte.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <CreativePlaceholder
                formato={anuncio.formato}
                titulo={anuncio.titulo}
                seed={anunciante.id}
                className="aspect-[2/1]"
              />
              <p className="text-xs text-muted-foreground">
                {anuncio.criativoAutorizado
                  ? "Criativo autorizado."
                  : "O criativo real não é exibido: não há autorização de uso. A imagem acima é uma prévia ilustrativa e fictícia."}
              </p>
              <blockquote className="border-l-2 border-primary/50 pl-4 text-base leading-relaxed">
                {anuncio.texto ?? <Unavailable>Texto não disponível nesta fonte</Unavailable>}
              </blockquote>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-muted-foreground">Chamada para ação:</span>
                {anuncio.cta ? <Badge variant="secondary">{anuncio.cta}</Badge> : <Unavailable />}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Disponibilidade dos campos</CardTitle>
              <CardDescription>O que a fonte de dados entregou para este anúncio.</CardDescription>
            </CardHeader>
            <CardContent>
              <FieldAvailabilityList disponibilidade={anuncio.disponibilidadeCampos} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Informações</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="divide-y">
                <InfoRow label="Anunciante">
                  {concorrenteId ? (
                    <Link href={`/concorrentes/${concorrenteId}`} className="font-medium text-primary hover:underline">
                      {anunciante.nome}
                    </Link>
                  ) : (
                    anunciante.nome
                  )}
                </InfoRow>
                <InfoRow label="Nicho">{anunciante.nicho}</InfoRow>
                <InfoRow label="Formato">{anuncio.formato ? FORMAT_LABELS[anuncio.formato] : <Unavailable />}</InfoRow>
                <InfoRow label="Plataformas">
                  {anuncio.plataformas.length > 0 ? (
                    anuncio.plataformas.map((p) => PLATFORM_LABELS[p]).join(", ")
                  ) : (
                    <Unavailable />
                  )}
                </InfoRow>
                <InfoRow label="Data de início">
                  {anuncio.dataInicio ? formatDate(anuncio.dataInicio) : <Unavailable />}
                </InfoRow>
                <InfoRow label="Situação conhecida">
                  {anuncio.ativo === null ? (
                    anuncio.dataFim ? (
                      `Encerramento informado: ${formatDate(anuncio.dataFim)}`
                    ) : (
                      <Unavailable>Não informada pela fonte</Unavailable>
                    )
                  ) : anuncio.ativo ? (
                    `Ativo na última coleta (${formatDate(anuncio.ultimaColeta)})`
                  ) : anuncio.dataFim ? (
                    `Encerrado em ${formatDate(anuncio.dataFim)}`
                  ) : (
                    "Encerrado (data não informada)"
                  )}
                </InfoRow>
                <InfoRow label="Tempo no ar">{dias !== null ? formatDays(dias) : <Unavailable />}</InfoRow>
                <InfoRow label="Países">{anuncio.paises.length > 0 ? anuncio.paises.join(", ") : <Unavailable />}</InfoRow>
                <InfoRow label="Link de destino">
                  {anuncio.linkDestino ? (
                    <a
                      href={anuncio.linkDestino}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      Abrir link <ExternalLink className="size-3.5" />
                    </a>
                  ) : (
                    <Unavailable />
                  )}
                </InfoRow>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Origem dos dados</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="divide-y">
                <InfoRow label="Fonte">
                  <Link href="/fontes" className="text-primary hover:underline">{fonte.nome}</Link>
                </InfoRow>
                {anuncio.origemArquivo && <InfoRow label="Arquivo de origem">{anuncio.origemArquivo}</InfoRow>}
                <InfoRow label="ID na fonte">{anuncio.externalId ?? <Unavailable />}</InfoRow>
                <InfoRow label={anuncio.isDemo ? "Primeira coleta" : "Primeira importação"}>
                  {formatDate(anuncio.primeiraColeta)}
                </InfoRow>
                <InfoRow label={anuncio.isDemo ? "Última coleta" : "Última importação"}>
                  {formatDate(anuncio.ultimaColeta)}
                </InfoRow>
              </dl>
            </CardContent>
          </Card>

          <p className="flex gap-2 text-xs text-muted-foreground">
            <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            Estas informações são fatos registrados pela fonte. Não há estimativa de investimento, alcance,
            faturamento ou vendas.
          </p>
        </div>
      </div>
    </>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Carregando anúncio">
      <Skeleton className="h-8 w-72 max-w-full" />
      <div className="grid gap-4 lg:grid-cols-5">
        <Skeleton className="h-96 rounded-xl lg:col-span-3" />
        <Skeleton className="h-96 rounded-xl lg:col-span-2" />
      </div>
    </div>
  );
}
