import { describe, expect, it } from "vitest";

import { emptyMapping, mappingErrors, sanitizeMapping, suggestMapping } from "@/modules/imports/mapping";
import {
  cleanText,
  normalizeRecord,
  parseCountries,
  parseDate,
  parseFormat,
  parseLink,
  parsePlatforms,
  parseStatus,
} from "@/modules/imports/normalize";

describe("sugestão de mapeamento", () => {
  it("reconhece nomes comuns, com acentos e maiúsculas", () => {
    const m = suggestMapping(["Anunciante", "Texto do anúncio", "Título", "Data de Início", "Plataforma", "URL"]);
    expect(m).toMatchObject({
      anunciante: "Anunciante",
      texto: "Texto do anúncio",
      titulo: "Título",
      data_inicio: "Data de Início",
      plataformas: "Plataforma",
      link_destino: "URL",
    });
  });

  it("reconhece nomes em inglês", () => {
    const m = suggestMapping(["page_name", "ad_creative_body", "ad_delivery_start_time", "publisher_platforms"]);
    expect(m.anunciante).toBe("page_name");
    expect(m.texto).toBe("ad_creative_body");
  });

  it("descarta colunas que não existem no arquivo", () => {
    const m = sanitizeMapping({ anunciante: "inexistente", texto: "b", formato: 123 }, ["a", "b"]);
    expect(m.anunciante).toBe("");
    expect(m.texto).toBe("b");
    expect(m.formato).toBe("");
  });

  it("exige anunciante e algum conteúdo", () => {
    expect(mappingErrors(emptyMapping())).toHaveLength(2);
    expect(mappingErrors({ ...emptyMapping(), anunciante: "a", titulo: "t" })).toEqual([]);
  });
});

describe("conversões de campos", () => {
  it("datas: aceita formatos brasileiros e ISO, recusa datas impossíveis", () => {
    expect(parseDate("2026-10-05")).toBe("2026-10-05");
    expect(parseDate("2026-10-05T14:30:00Z")).toBe("2026-10-05");
    expect(parseDate("5/10/2026")).toBe("2026-10-05");
    expect(parseDate("05-10-2026")).toBe("2026-10-05");
    expect(parseDate("31/02/2026")).toBeNull();
    expect(parseDate("ontem")).toBeNull();
    expect(parseDate("10/05")).toBeNull();
  });

  it("formatos e plataformas: aceita sinônimos e aponta os desconhecidos", () => {
    expect(parseFormat("Vídeo")).toBe("video");
    expect(parseFormat("Carousel")).toBe("carrossel");
    expect(parseFormat("holograma")).toBeNull();
    expect(parsePlatforms("FB, IG; Audience Network | tiktok")).toEqual({
      plataformas: ["facebook", "instagram", "audience_network"],
      desconhecidas: ["tiktok"],
    });
  });

  it("situação: reconhece ativo/encerrado e não adivinha o resto", () => {
    expect(parseStatus("Ativo")).toBe(true);
    expect(parseStatus("INACTIVE")).toBe(false);
    expect(parseStatus("não")).toBe(false);
    expect(parseStatus("talvez")).toBeNull();
  });

  it("links: só http e https", () => {
    expect(parseLink("https://exemplo.com.br/a?b=1")).toBe("https://exemplo.com.br/a?b=1");
    expect(parseLink("javascript:alert(1)")).toBeNull();
    expect(parseLink("data:text/html,<script>")).toBeNull();
    expect(parseLink("ftp://x.com")).toBeNull();
    expect(parseLink("exemplo.com")).toBeNull();
  });

  it("países: códigos de 2 letras e nomes conhecidos", () => {
    expect(parseCountries("br, Brasil, pt, Atlântida")).toEqual(["BR", "PT"]);
  });

  it("texto: remove caracteres de controle e preserva acentos e emojis", () => {
    expect(cleanText("  Olá\u0000  mundo ☕  ")).toBe("Olá mundo ☕");
    expect(cleanText("linha 1\n\n\n\nlinha 2", true)).toBe("linha 1\n\nlinha 2");
  });
});

describe("normalizeRecord", () => {
  const mapping = { ...emptyMapping(), anunciante: "anunciante", texto: "texto", link_destino: "link", formato: "formato" };

  it("normaliza uma linha válida e marca campos não mapeados", () => {
    const r = normalizeRecord({ anunciante: " Loja  X ", texto: "Oi", link: "https://a.com", formato: "imagem" }, mapping);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.anuncio.anunciante).toBe("Loja X");
    expect(r.anuncio.disponibilidade.texto).toBe("disponivel");
    expect(r.anuncio.disponibilidade.data_inicio).toBe("nao_fornecido_pela_fonte");
    expect(r.anuncio.disponibilidade.criativo).toBe("nao_fornecido_pela_fonte");
    expect(r.anuncio.ativo).toBeNull();
  });

  it("campos ausentes ficam vazios, sem inventar valores", () => {
    const r = normalizeRecord({ anunciante: "Loja", texto: "Oi", link: "", formato: "" }, mapping);
    expect(r.ok && r.anuncio.linkDestino).toBeNull();
    expect(r.ok && r.anuncio.formato).toBeNull();
    expect(r.ok && r.anuncio.disponibilidade.link_destino).toBe("vazio");
    expect(r.ok && r.anuncio.plataformas).toEqual([]);
  });

  it("descarta link perigoso com aviso, mantendo o anúncio", () => {
    const r = normalizeRecord({ anunciante: "Loja", texto: "Oi", link: "javascript:alert(1)", formato: "" }, mapping);
    expect(r.ok && r.anuncio.linkDestino).toBeNull();
    expect(r.ok && r.avisos[0]).toContain("Link ignorado");
  });

  it("rejeita linha sem anunciante ou sem conteúdo", () => {
    expect(normalizeRecord({ anunciante: "", texto: "Oi" }, mapping)).toMatchObject({ ok: false, motivo: "Anunciante não informado." });
    expect(normalizeRecord({ anunciante: "Loja", texto: "", link: "", formato: "video" }, mapping)).toMatchObject({ ok: false });
  });

  it("rejeita células gigantes", () => {
    const r = normalizeRecord({ anunciante: "Loja", texto: "x".repeat(20_000) }, mapping);
    expect(r).toMatchObject({ ok: false });
  });

  it("ignora data de fim anterior ao início", () => {
    const m = { ...mapping, data_inicio: "i", data_fim: "f" };
    const r = normalizeRecord({ anunciante: "Loja", texto: "Oi", i: "2026-10-10", f: "2026-10-01" }, m);
    expect(r.ok && r.anuncio.dataFim).toBeNull();
    expect(r.ok && r.avisos.some((a) => a.includes("anterior"))).toBe(true);
  });
});
