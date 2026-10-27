import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { AdFiltersForm } from "@/components/ads/ad-filters";
import { AdGrid, AdGridSkeleton } from "@/components/ads/ad-grid";
import { Pagination } from "@/components/ads/pagination";
import { DemoBadge } from "@/components/layout/demo-badge";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getRepository } from "@/data/repositories";
import { countActiveFilters, filtersToSearchParams, parseFilters } from "@/modules/ads/search";
import { formatNumber } from "@/lib/format";

export const metadata: Metadata = { title: "Explorar anúncios" };

export default function ExplorarPage(props: PageProps<"/explorar">) {
  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Explorar anúncios"
        descricao="Pesquise por palavras-chave e combine filtros de nicho, anunciante, plataforma, formato, período e situação."
        acoes={<DemoBadge />}
      />
      <Suspense fallback={<ExplorerSkeleton />}>
        <ExplorerResults searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

async function ExplorerResults({ searchParams }: Pick<PageProps<"/explorar">, "searchParams">) {
  const filters = parseFilters(await searchParams);
  const repo = getRepository();
  const [result, options] = await Promise.all([repo.searchAds(filters), repo.getFilterOptions(filters.fonte)]);
  const { pagina } = result;
  const params = filtersToSearchParams({ ...filters, pagina: 1 });
  const activeCount = countActiveFilters(filters);

  return (
    <>
      {/* A "key" recria o formulário quando a URL muda, para que "Limpar filtros" esvazie os campos. */}
      <div key={params.toString()}>
        <AdFiltersForm action="/explorar" filters={filters} options={options} />
      </div>

      <section aria-label="Resultados" className="space-y-4">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          <strong className="text-foreground">{formatNumber(pagina.total)}</strong>{" "}
          {pagina.total === 1 ? "anúncio encontrado" : "anúncios encontrados"}
          {activeCount > 0 && ` com ${activeCount} ${activeCount === 1 ? "filtro" : "filtros"}`} · fonte:{" "}
          {options.fonte.nome}
        </p>

        <AdGrid
          views={pagina.itens}
          dataReferencia={result.dataReferencia}
          vazio={{
            titulo: "Nenhum anúncio encontrado",
            descricao: "Nenhum anúncio da base atende a todos os filtros escolhidos. Tente remover alguns filtros ou usar outras palavras-chave.",
            acao: (
              <Button asChild size="sm" variant="outline">
                <Link href="/explorar">Limpar filtros</Link>
              </Button>
            ),
          }}
        />

        <Pagination basePath="/explorar" params={params} pagina={pagina.pagina} totalPaginas={pagina.totalPaginas} />
      </section>
    </>
  );
}

function ExplorerSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-64 rounded-xl" />
      <Skeleton className="h-4 w-48" />
      <AdGridSkeleton />
    </div>
  );
}
