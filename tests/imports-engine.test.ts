import { mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { loadStore, saveStore } from "@/data/imports/file-store";
import { demoAds } from "@/data/demo/seed";
import { DEFAULT_FILTERS, filterAds } from "@/modules/ads/search";
import { IMPORT_SOURCE_ID, applyImport, emptyStore, type ImportStore } from "@/modules/imports/engine";
import { emptyMapping, type ColumnMapping } from "@/modules/imports/mapping";
import type { RawRecord } from "@/modules/imports/parse";

const mapping: ColumnMapping = {
  ...emptyMapping(),
  id_externo: "id",
  anunciante: "anunciante",
  texto: "texto",
  titulo: "titulo",
  status: "status",
  paises: "pais",
};

const AGORA = "2026-10-27T12:00:00.000Z";

function run(store: ImportStore, linhas: RawRecord[], m: ColumnMapping = mapping, arquivo = "teste.csv") {
  return applyImport(store, { arquivo, formato: "csv", linhas, mapeamento: m, agora: AGORA });
}

const rows: RawRecord[] = [
  { id: "A1", anunciante: "Loja Ação", texto: "Oferta ☕", titulo: "T1", status: "ativo", pais: "BR" },
  { id: "A2", anunciante: "Loja Ação", texto: "Outra oferta", titulo: "T2", status: "", pais: "" },
  { id: "", anunciante: "", texto: "sem anunciante", titulo: "", status: "", pais: "" },
];

describe("applyImport", () => {
  it("primeira importação: novos e rejeitados", () => {
    const { store, resumo } = run(emptyStore(), rows);
    expect(resumo).toMatchObject({ novos: 2, atualizados: 0, duplicados: 0, rejeitados: 1 });
    expect(resumo.execucao.status).toBe("parcial");
    expect(resumo.execucao.rejeitadas).toEqual([{ linha: 4, motivo: "Anunciante não informado." }]);
    expect(store.anunciantes).toHaveLength(1);
    expect(store.anuncios.every((a) => a.dataSourceId === IMPORT_SOURCE_ID && !a.isDemo)).toBe(true);
    expect(store.anuncios.every((a) => a.origemArquivo === "teste.csv")).toBe(true);
  });

  it("importar o mesmo arquivo de novo não duplica anúncios", () => {
    const first = run(emptyStore(), rows).store;
    const { store, resumo } = run(first, rows);
    expect(resumo).toMatchObject({ novos: 0, atualizados: 0, duplicados: 2, rejeitados: 1 });
    expect(store.anuncios).toHaveLength(2);
    expect(store.execucoes).toHaveLength(2);
  });

  it("linhas repetidas dentro do mesmo arquivo contam como duplicadas", () => {
    const { store, resumo } = run(emptyStore(), [rows[0], rows[0], { ...rows[0] }]);
    expect(resumo).toMatchObject({ novos: 1, duplicados: 2 });
    expect(store.anuncios).toHaveLength(1);
  });

  it("mesmo ID com conteúdo diferente conta como atualizado", () => {
    const first = run(emptyStore(), rows).store;
    const { store, resumo } = run(first, [{ ...rows[0], texto: "Oferta nova", status: "encerrado" }]);
    expect(resumo).toMatchObject({ novos: 0, atualizados: 1 });
    const ad = store.anuncios.find((a) => a.externalId === "A1")!;
    expect(ad.texto).toBe("Oferta nova");
    expect(ad.ativo).toBe(false);
  });

  it("sem ID, reconhece o mesmo anúncio ignorando maiúsculas, acentos e espaços", () => {
    const m = { ...mapping, id_externo: "" };
    const first = run(emptyStore(), [{ anunciante: "Loja Ação", texto: "Oferta  especial", titulo: "" }], m).store;
    // Espaços extras não contam como mudança: duplicado.
    expect(run(first, [{ anunciante: "Loja Ação", texto: "Oferta especial", titulo: "" }], m).resumo).toMatchObject({
      novos: 0,
      duplicados: 1,
    });
    // Maiúsculas/acentos: é o mesmo anúncio (não cria outro), mas o texto mudou, então conta como atualizado.
    const { store, resumo } = run(first, [{ anunciante: "LOJA ACAO", texto: "oferta especial", titulo: "" }], m);
    expect(resumo).toMatchObject({ novos: 0, atualizados: 1 });
    expect(store.anuncios).toHaveLength(1);
    expect(store.anunciantes).toHaveLength(1);
  });

  it("um arquivo sem uma coluna não apaga o que já se sabia", () => {
    const first = run(emptyStore(), rows).store;
    const noTitle = { ...mapping, titulo: "" };
    const { store } = run(first, [{ id: "A1", anunciante: "Loja Ação", texto: "Oferta ☕", status: "ativo", pais: "BR" }], noTitle);
    const ad = store.anuncios.find((a) => a.externalId === "A1")!;
    expect(ad.titulo).toBe("T1");
    expect(ad.disponibilidadeCampos.titulo).toBe("disponivel");
  });

  it("situação ausente fica desconhecida (não é inventada)", () => {
    const { store } = run(emptyStore(), rows);
    expect(store.anuncios.find((a) => a.externalId === "A2")!.ativo).toBeNull();
  });

  it("IDs gerados são estáveis entre importações", () => {
    const a = run(emptyStore(), rows).store.anuncios.map((x) => x.id);
    const b = run(emptyStore(), rows).store.anuncios.map((x) => x.id);
    expect(a).toEqual(b);
    expect(a.every((id) => id.startsWith("imp-"))).toBe(true);
  });

  it("arquivo sem nenhuma linha válida termina como falha, sem gravar anúncios", () => {
    const { store, resumo } = run(emptyStore(), [rows[2]]);
    expect(resumo.execucao.status).toBe("falhou");
    expect(store.anuncios).toHaveLength(0);
  });

  it("não altera os dados de demonstração", () => {
    const before = JSON.stringify(demoAds);
    run(emptyStore(), rows);
    expect(JSON.stringify(demoAds)).toBe(before);
  });
});

describe("busca com dados importados", () => {
  it("filtra por fonte e por país, e situação desconhecida não entra em ativos/encerrados", () => {
    const { store } = run(emptyStore(), rows);
    const advertisers = new Map(store.anunciantes.map((a) => [a.id, a]));
    const all = [...demoAds, ...store.anuncios];
    expect(filterAds(all, advertisers, { ...DEFAULT_FILTERS, fonte: IMPORT_SOURCE_ID })).toHaveLength(2);
    expect(filterAds(all, advertisers, { ...DEFAULT_FILTERS, fonte: "demo" })).toHaveLength(demoAds.length);
    const br = filterAds(store.anuncios, advertisers, { ...DEFAULT_FILTERS, pais: "BR" });
    expect(br.map((a) => a.externalId)).toEqual(["A1"]);
    const inativos = filterAds(store.anuncios, advertisers, { ...DEFAULT_FILTERS, status: "inativo" });
    expect(inativos).toHaveLength(0);
  });
});

describe("armazenamento local", () => {
  let dir: string;
  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), "adintel-teste-"));
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("começa vazio quando o arquivo não existe", async () => {
    expect(await loadStore(dir)).toEqual(emptyStore());
  });

  it("grava e lê de volta (dados sobrevivem a reinício)", async () => {
    const { store } = run(emptyStore(), rows);
    await saveStore(store, dir);
    const loaded = await loadStore(dir);
    expect(loaded.anuncios).toHaveLength(2);
    expect(loaded.anuncios[0].texto).toBe("Oferta ☕");
    const files = await readdir(dir);
    expect(files.some((f) => f.endsWith(".tmp"))).toBe(false);
  });

  it("arquivo danificado: guarda uma cópia e recomeça sem travar", async () => {
    await writeFile(path.join(dir, "importacoes.json"), "{ corrompido", "utf8");
    const originalWarn = console.warn;
    console.warn = () => {};
    try {
      expect(await loadStore(dir)).toEqual(emptyStore());
    } finally {
      console.warn = originalWarn;
    }
    const files = await readdir(dir);
    expect(files.some((f) => f.startsWith("importacoes.corrompido-"))).toBe(true);
  });
});
