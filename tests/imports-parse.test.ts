import { describe, expect, it } from "vitest";

import { IMPORT_LIMITS, formatFromFileName, sanitizeFileName } from "@/modules/imports/limits";
import { detectDelimiter, parseCsv, parseJson } from "@/modules/imports/parse";

describe("formato e nome do arquivo", () => {
  it("aceita somente .csv e .json", () => {
    expect(formatFromFileName("dados.CSV")).toBe("csv");
    expect(formatFromFileName("dados.json")).toBe("json");
    expect(formatFromFileName("script.js")).toBeNull();
    expect(formatFromFileName("planilha.xlsx")).toBeNull();
    expect(formatFromFileName("csv")).toBeNull();
  });

  it("remove pastas e caracteres de controle do nome", () => {
    expect(sanitizeFileName("C:\\Users\\x\\..\\anuncios.csv")).toBe("anuncios.csv");
    expect(sanitizeFileName("../../etc/passwd.csv")).toBe("passwd.csv");
    expect(sanitizeFileName("a\u0000b.csv")).toBe("ab.csv");
  });
});

describe("parseCsv", () => {
  it("lê arquivo simples com vírgula", () => {
    const r = parseCsv("anunciante,texto\nLoja A,Olá mundo\nLoja B,Tchau");
    expect(r.ok && r.tabela.linhas).toEqual([
      { anunciante: "Loja A", texto: "Olá mundo" },
      { anunciante: "Loja B", texto: "Tchau" },
    ]);
  });

  it("detecta ponto e vírgula (padrão do Excel no Brasil) e remove o BOM", () => {
    const text = "\uFEFFanunciante;texto\r\nLoja;Preço: R$ 9,90\r\n";
    expect(detectDelimiter(text.slice(1))).toBe(";");
    const r = parseCsv(text);
    expect(r.ok && r.tabela.colunas).toEqual(["anunciante", "texto"]);
    expect(r.ok && r.tabela.linhas[0].texto).toBe("Preço: R$ 9,90");
  });

  it("entende aspas, aspas duplicadas e quebras de linha dentro de aspas", () => {
    const r = parseCsv('anunciante,texto\n"Loja, Ltda","Ele disse ""oi""\nnova linha"');
    expect(r.ok && r.tabela.linhas[0]).toEqual({ anunciante: "Loja, Ltda", texto: 'Ele disse "oi"\nnova linha' });
  });

  it("mantém acentos, emojis e símbolos", () => {
    const r = parseCsv("anunciante,texto\nAçaí & Cia ☕,Promoção ✨ 50% — só hoje!");
    expect(r.ok && r.tabela.linhas[0].texto).toBe("Promoção ✨ 50% — só hoje!");
    expect(r.ok && r.tabela.linhas[0].anunciante).toBe("Açaí & Cia ☕");
  });

  it("ignora linhas vazias e completa colunas faltando", () => {
    const r = parseCsv("a,b,c\n\n1,2\n\n");
    expect(r.ok && r.tabela.linhas).toEqual([{ a: "1", b: "2", c: "" }]);
  });

  it("renomeia colunas repetidas ou sem nome", () => {
    const r = parseCsv("texto,texto,\n1,2,3");
    expect(r.ok && r.tabela.colunas).toEqual(["texto", "texto_2", "coluna_3"]);
  });

  it("recusa arquivos inválidos com mensagem clara", () => {
    expect(parseCsv("")).toMatchObject({ ok: false, erro: "O arquivo está vazio." });
    expect(parseCsv("so,cabecalho")).toMatchObject({ ok: false });
    expect(parseCsv('a,b\n"aspas sem fim,2')).toMatchObject({ ok: false, erro: expect.stringContaining("aspas") });
  });

  it("recusa arquivos acima do limite de linhas", () => {
    const text = "a\n" + "x\n".repeat(IMPORT_LIMITS.maxRows + 5);
    expect(parseCsv(text)).toMatchObject({ ok: false, erro: expect.stringContaining("linhas") });
  });

  it("não executa nada: fórmulas e scripts continuam sendo só texto", () => {
    const r = parseCsv('anunciante,texto\n=CMD(),<script>alert(1)</script>');
    expect(r.ok && r.tabela.linhas[0]).toEqual({ anunciante: "=CMD()", texto: "<script>alert(1)</script>" });
  });
});

describe("parseJson", () => {
  it("aceita uma lista de anúncios", () => {
    const r = parseJson('[{"anunciante":"Loja","texto":"Oi","plataformas":["facebook","instagram"],"ativo":true}]');
    expect(r.ok && r.tabela.linhas[0]).toEqual({
      anunciante: "Loja",
      texto: "Oi",
      plataformas: "facebook, instagram",
      ativo: "true",
    });
  });

  it('aceita objeto com a lista em "anuncios"', () => {
    const r = parseJson('{"anuncios":[{"anunciante":"A"},{"anunciante":"B","extra":1}]}');
    expect(r.ok && r.tabela.colunas).toEqual(["anunciante", "extra"]);
    expect(r.ok && r.tabela.linhas[0].extra).toBe("");
  });

  it("ignora objetos aninhados em vez de inventar texto", () => {
    const r = parseJson('[{"anunciante":"A","meta":{"x":1}}]');
    expect(r.ok && r.tabela.linhas[0].meta).toBe("");
  });

  it("recusa JSON quebrado ou sem lista", () => {
    expect(parseJson("{ isto não é json")).toMatchObject({ ok: false });
    expect(parseJson('{"nome":"x"}')).toMatchObject({ ok: false });
    expect(parseJson("[1, 2, 3]")).toMatchObject({ ok: false });
    expect(parseJson("[]")).toMatchObject({ ok: false });
  });
});
