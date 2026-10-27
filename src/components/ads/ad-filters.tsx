import Form from "next/form";
import Link from "next/link";
import { Search, SlidersHorizontal } from "lucide-react";

import { Field, NativeSelect } from "@/components/shared/native-select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { FilterOptions } from "@/data/repositories/types";
import { FORMATS, PLATFORMS, SORT_OPTIONS, type AdFilters } from "@/modules/ads/search";
import type { SearchFilter } from "@/modules/providers/types";
import { FORMAT_LABELS, PLATFORM_LABELS, SORT_LABELS } from "@/lib/format";

/**
 * Formulário de filtros do Explorador.
 *
 * É um formulário comum: ao enviar, os filtros vão para a URL (ex.: ?q=treino&formato=video).
 * Assim a pesquisa pode ser recarregada, compartilhada ou voltada pelo navegador.
 * Filtros que a fonte não suporta aparecem desabilitados, com explicação.
 */
export function AdFiltersForm({
  action,
  filters,
  options,
}: {
  action: string;
  filters: AdFilters;
  options: FilterOptions;
}) {
  const supported = new Set<SearchFilter>(options.fonte.capacidades.filtros);
  const unsupportedHint = `Não suportado pela fonte "${options.fonte.nome}".`;
  const can = (f: SearchFilter) => supported.has(f);

  return (
    <Card className="py-0">
      <CardContent className="p-4 md:p-5">
        <Form action={action} className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                name="q"
                type="search"
                defaultValue={filters.q}
                placeholder="Palavras-chave no texto, título, CTA ou anunciante…"
                aria-label="Palavras-chave"
                className="pl-8"
                disabled={!can("palavra_chave")}
                maxLength={100}
              />
            </div>
            <Button type="submit" className="sm:w-auto">
              <Search /> Pesquisar
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Field label="Nicho" htmlFor="f-nicho" hint={can("nicho") ? undefined : unsupportedHint}>
              <NativeSelect id="f-nicho" name="nicho" defaultValue={filters.nicho} disabled={!can("nicho")}>
                <option value="">Todos os nichos</option>
                {options.nichos.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </NativeSelect>
            </Field>

            <Field label="Anunciante" htmlFor="f-anunciante" hint={can("anunciante") ? undefined : unsupportedHint}>
              <NativeSelect id="f-anunciante" name="anunciante" defaultValue={filters.anunciante} disabled={!can("anunciante")}>
                <option value="">Todos os anunciantes</option>
                {options.anunciantes.map((a) => (
                  <option key={a.id} value={a.id}>{a.nome}</option>
                ))}
              </NativeSelect>
            </Field>

            <Field label="Plataforma" htmlFor="f-plataforma" hint={can("plataforma") ? undefined : unsupportedHint}>
              <NativeSelect id="f-plataforma" name="plataforma" defaultValue={filters.plataforma} disabled={!can("plataforma")}>
                <option value="">Todas as plataformas</option>
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>{PLATFORM_LABELS[p]}</option>
                ))}
              </NativeSelect>
            </Field>

            <Field label="Formato" htmlFor="f-formato" hint={can("formato") ? undefined : unsupportedHint}>
              <NativeSelect id="f-formato" name="formato" defaultValue={filters.formato} disabled={!can("formato")}>
                <option value="">Todos os formatos</option>
                {FORMATS.map((f) => (
                  <option key={f} value={f}>{FORMAT_LABELS[f]}</option>
                ))}
              </NativeSelect>
            </Field>

            <Field label="Situação" htmlFor="f-status" hint={can("status") ? undefined : unsupportedHint}>
              <NativeSelect id="f-status" name="status" defaultValue={filters.status} disabled={!can("status")}>
                <option value="">Ativos e encerrados</option>
                <option value="ativo">Somente ativos</option>
                <option value="inativo">Somente encerrados</option>
              </NativeSelect>
            </Field>

            <Field label="Início a partir de" htmlFor="f-de" hint={can("periodo") ? undefined : unsupportedHint}>
              <Input id="f-de" name="de" type="date" defaultValue={filters.de} disabled={!can("periodo")} />
            </Field>

            <Field label="Início até" htmlFor="f-ate" hint={can("periodo") ? undefined : unsupportedHint}>
              <Input id="f-ate" name="ate" type="date" defaultValue={filters.ate} disabled={!can("periodo")} />
            </Field>

            <Field label="País" htmlFor="f-pais" hint={can("pais") ? undefined : unsupportedHint}>
              <NativeSelect
                id="f-pais"
                name={can("pais") ? "pais" : undefined}
                disabled={!can("pais")}
                defaultValue={can("pais") ? filters.pais : ""}
              >
                <option value="">Todos os países</option>
                {can("pais") &&
                  options.paises.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
              </NativeSelect>
            </Field>
          </div>

          <div className="flex flex-col gap-3 border-t pt-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:flex">

              <Field label="Fonte dos dados" htmlFor="f-fonte" className="xl:w-56">
                <NativeSelect id="f-fonte" name="fonte" defaultValue={filters.fonte}>
                  <option value="">Todas as fontes</option>
                  {options.fontes.map((f) => (
                    <option key={f.id} value={f.id}>{f.nome}</option>
                  ))}
                </NativeSelect>
              </Field>
              <Field label="Ordenar por" htmlFor="f-ordem" className="xl:w-56">
                <NativeSelect id="f-ordem" name="ordem" defaultValue={filters.ordem}>
                  {SORT_OPTIONS.map((o) => (
                    <option key={o} value={o}>{SORT_LABELS[o]}</option>
                  ))}
                </NativeSelect>
              </Field>
            </div>
            <div className="flex justify-end gap-2">
              <Button asChild variant="ghost" size="sm">
                <Link href={action}>Limpar filtros</Link>
              </Button>
              <Button type="submit" variant="secondary" size="sm">
                <SlidersHorizontal /> Aplicar filtros
              </Button>
            </div>
          </div>
        </Form>
      </CardContent>
    </Card>
  );
}
