import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { Suspense } from "react";
import { Search } from "lucide-react";

import { AdGrid, AdGridSkeleton } from "@/components/ads/ad-grid";
import { Pagination } from "@/components/ads/pagination";
import { DemoBadge } from "@/components/layout/demo-badge";
import { Field, NativeSelect } from "@/components/shared/native-select";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { getRepository } from "@/data/repositories";
import { DEFAULT_FILTERS, SORT_OPTIONS, filtersToSearchParams, parseFilters } from "@/modules/ads/search";
import { SORT_LABELS, formatNumber } from "@/lib/format";

export const metadata: Metadata = { title: "Biblioteca" };

export default function BibliotecaPage(props: PageProps<"/biblioteca">) {
  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Biblioteca de anúncios"
        descricao="Todos os anúncios coletados, com anunciante, formato, plataformas, datas e origem dos dados."
        acoes={
          <>
            <DemoBadge />
            <Button asChild variant="outline" size="sm">
              <Link href="/explorar">
                <Search /> Pesquisa avançada
              </Link>
            </Button>
          </>
        }
      />
      <Suspense fallback={<AdGridSkeleton />}>
        <LibraryList searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

async function LibraryList({ searchParams }: Pick<PageProps<"/biblioteca">, "searchParams">) {
  const parsed = parseFilters(await searchParams);
  // A Biblioteca usa só fonte, situação e ordenação; a busca completa fica no Explorador.
  const filters = {
    ...DEFAULT_FILTERS,
    fonte: parsed.fonte,
    status: parsed.status,
    ordem: parsed.ordem,
    pagina: parsed.pagina,
  };
  const repo = getRepository();
  const [{ pagina, dataReferencia }, options] = await Promise.all([repo.searchAds(filters), repo.getFilterOptions()]);
  const params = filtersToSearchParams({ fonte: filters.fonte, status: filters.status, ordem: filters.ordem });

  return (
    <section aria-label="Anúncios" className="space-y-4">
      <div key={params.toString()} className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">{formatNumber(pagina.total)}</strong> anúncios na biblioteca
        </p>
        <Form action="/biblioteca" className="flex flex-wrap items-end gap-2">
          <Field label="Fonte" htmlFor="b-fonte" className="w-48">
            <NativeSelect id="b-fonte" name="fonte" defaultValue={filters.fonte}>
              <option value="">Todas as fontes</option>
              {options.fontes.map((f) => (
                <option key={f.id} value={f.id}>{f.nome}</option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Situação" htmlFor="b-status" className="w-44">
            <NativeSelect id="b-status" name="status" defaultValue={filters.status}>
              <option value="">Ativos e encerrados</option>
              <option value="ativo">Somente ativos</option>
              <option value="inativo">Somente encerrados</option>
            </NativeSelect>
          </Field>
          <Field label="Ordenar por" htmlFor="b-ordem" className="w-48">
            <NativeSelect id="b-ordem" name="ordem" defaultValue={filters.ordem}>
              {SORT_OPTIONS.map((o) => (
                <option key={o} value={o}>{SORT_LABELS[o]}</option>
              ))}
            </NativeSelect>
          </Field>
          <Button type="submit" variant="secondary">Aplicar</Button>
        </Form>
      </div>

      <AdGrid
        views={pagina.itens}
        dataReferencia={dataReferencia}
        vazio={{
          titulo: "Nenhum anúncio na biblioteca",
          descricao: "Quando houver anúncios coletados ou importados, eles aparecerão aqui.",
        }}
      />

      <Pagination basePath="/biblioteca" params={params} pagina={pagina.pagina} totalPaginas={pagina.totalPaginas} />
    </section>
  );
}
