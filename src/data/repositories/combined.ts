import { connection } from "next/server";

import { demoAdvertisersById, demoRepository, toView as demoView } from "@/data/demo/repository";
import { DEMO_REFERENCE_DATE, demoAds } from "@/data/demo/seed";
import { loadStore } from "@/data/imports/file-store";
import type { Ad, Advertiser } from "@/modules/ads/types";
import { filterAds, paginate, sortAds, type SourceFilter } from "@/modules/ads/search";
import { IMPORT_SOURCE_ID, type ImportRunRecord } from "@/modules/imports/engine";
import { PROVIDERS, getProviderInfo } from "@/modules/providers/registry";
import type { ProviderInfo, SearchFilter } from "@/modules/providers/types";
import type { AdView, FilterOptions, Repository } from "./types";

/**
 * Repositório que junta os dados de demonstração e os importados pelo usuário.
 *
 * - Painel e Concorrentes continuam somente com os dados de demonstração.
 * - Explorador e Biblioteca mostram as duas fontes, cada anúncio com sua origem.
 * - Os importados são lidos do arquivo local a cada requisição (por isso o `connection()`).
 */

const importSource = getProviderInfo(IMPORT_SOURCE_ID) as ProviderInfo;

async function loadImported() {
  await connection();
  return loadStore();
}

function importedView(ad: Ad, advertisers: Map<string, Advertiser>): AdView {
  return {
    anuncio: ad,
    anunciante: advertisers.get(ad.advertiserId) as Advertiser,
    fonte: importSource,
    concorrenteId: null,
  };
}

function allAdvertisers(imported: Advertiser[]): Map<string, Advertiser> {
  return new Map([...demoAdvertisersById, ...imported.map((a) => [a.id, a] as const)]);
}

/** Capacidades combinadas quando a busca usa todas as fontes ativas. */
function combinedSource(sources: ProviderInfo[]): ProviderInfo {
  const filtros = [...new Set(sources.flatMap((s) => s.capacidades.filtros))] as SearchFilter[];
  return {
    ...sources[0],
    id: "todas",
    nome: "Todas as fontes ativas",
    capacidades: { ...sources[0].capacidades, filtros },
  };
}

export const combinedRepository: Repository = {
  ...demoRepository,

  async searchAds(filters) {
    const store = await loadImported();
    const advertisers = allAdvertisers(store.anunciantes);
    const ads = [...demoAds, ...store.anuncios];
    const sorted = sortAds(filterAds(ads, advertisers, filters), advertisers, filters.ordem, DEMO_REFERENCE_DATE);
    const page = paginate(sorted, filters.pagina);
    return {
      dataReferencia: DEMO_REFERENCE_DATE,
      pagina: {
        ...page,
        itens: page.itens.map((ad) =>
          ad.dataSourceId === IMPORT_SOURCE_ID ? importedView(ad, advertisers) : demoView(ad),
        ),
      },
    };
  },

  async getFilterOptions(fonte: SourceFilter | "" = ""): Promise<FilterOptions> {
    const store = await loadImported();
    const demo = await demoRepository.getFilterOptions();
    const activeSources = PROVIDERS.filter((p) => p.status === "ativo");

    const advertisers = [
      ...(fonte !== IMPORT_SOURCE_ID ? demo.anunciantes : []),
      ...(fonte !== "demo" ? store.anunciantes.map((a) => ({ id: a.id, nome: a.nome })) : []),
    ].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

    const importedNiches = store.anunciantes.map((a) => a.nicho);
    const nichos = [...new Set([
      ...(fonte !== IMPORT_SOURCE_ID ? demo.nichos : []),
      ...(fonte !== "demo" ? importedNiches : []),
    ])].sort((a, b) => a.localeCompare(b, "pt-BR"));

    const paises = [...new Set([
      ...(fonte !== IMPORT_SOURCE_ID ? demo.paises : []),
      ...(fonte !== "demo" ? store.anuncios.flatMap((ad) => ad.paises) : []),
    ])].sort();

    const selected = fonte ? getProviderInfo(fonte) : undefined;
    return {
      nichos,
      anunciantes: advertisers,
      paises,
      fonte: selected ?? combinedSource(activeSources),
      fontes: activeSources,
    };
  },

  async getAd(id) {
    if (!id.startsWith("imp-")) return demoRepository.getAd(id);
    const store = await loadImported();
    const ad = store.anuncios.find((a) => a.id === id);
    return ad ? importedView(ad, allAdvertisers(store.anunciantes)) : null;
  },
};

/** Histórico de importações, do mais recente para o mais antigo. */
export async function listImportRuns(): Promise<ImportRunRecord[]> {
  const store = await loadImported();
  return store.execucoes;
}

export async function importedCounts() {
  const store = await loadImported();
  return { anuncios: store.anuncios.length, anunciantes: store.anunciantes.length };
}
