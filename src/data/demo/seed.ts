/**
 * DADOS DE DEMONSTRAÇÃO.
 *
 * Tudo aqui é fictício: anunciantes, anúncios, pesquisas e importações.
 * Os nomes foram inventados e não representam empresas reais.
 * Os dados são gerados de forma determinística (sempre iguais), a partir
 * de uma data de referência fixa, para que as telas e os testes sejam estáveis.
 */
import type {
  Ad,
  AdFormat,
  Advertiser,
  Competitor,
  ImportRun,
  Platform,
  Search,
} from "@/modules/ads/types";

export const DEMO_WORKSPACE_ID = "ws-demo";
export const DEMO_SOURCE_ID = "demo";

/** "Hoje" para os dados de demonstração. */
export const DEMO_REFERENCE_DATE = "2026-10-20";

const DAY_MS = 24 * 60 * 60 * 1000;

export function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  return new Date(d.getTime() + days * DAY_MS).toISOString().slice(0, 10);
}

/** Gerador pseudoaleatório com semente fixa (mulberry32). */
function createRandom(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface NicheCopy {
  ganchos: string[];
  ofertas: string[];
  ctas: string[];
}

const COPY_BY_NICHE: Record<string, NicheCopy> = {
  Fitness: {
    ganchos: ["Cansado de treinar sem ver resultado?", "Seu treino em 20 minutos por dia.", "O erro que trava sua evolução na academia."],
    ofertas: ["Primeira semana grátis no app.", "Plano anual com 30% de desconto.", "Avaliação física sem custo."],
    ctas: ["Saiba mais", "Cadastre-se", "Baixar"],
  },
  Moda: {
    ganchos: ["A coleção de verão chegou.", "Peças que combinam com tudo.", "Seu novo básico favorito."],
    ofertas: ["Frete grátis acima de R$ 199.", "Leve 3, pague 2.", "10% off na primeira compra."],
    ctas: ["Comprar agora", "Ver coleção", "Saiba mais"],
  },
  Educação: {
    ganchos: ["Fluência em 6 meses é possível?", "Aprenda no seu ritmo.", "A habilidade mais pedida pelas empresas."],
    ofertas: ["Aula experimental gratuita.", "Matrículas com bônus exclusivo.", "Certificado incluso."],
    ctas: ["Inscreva-se", "Saiba mais", "Cadastre-se"],
  },
  Beleza: {
    ganchos: ["Pele radiante sem complicação.", "Rotina de skincare em 3 passos.", "Ingredientes naturais, resultado visível."],
    ofertas: ["Kit com brinde surpresa.", "Amostra grátis no primeiro pedido.", "Assinatura com 15% off."],
    ctas: ["Comprar agora", "Experimentar", "Saiba mais"],
  },
  Viagens: {
    ganchos: ["Suas férias começam aqui.", "Destinos nacionais que surpreendem.", "Viaje mais gastando menos."],
    ofertas: ["Parcelamento em até 10x.", "Pacotes com hotel e aéreo.", "Cupom para a primeira reserva."],
    ctas: ["Reservar", "Ver ofertas", "Saiba mais"],
  },
  "Casa e Decoração": {
    ganchos: ["Transforme sua sala em um fim de semana.", "Decoração que cabe no bolso.", "Conforto para o dia a dia."],
    ofertas: ["Montagem grátis.", "Até 20% off em móveis selecionados.", "Entrega rápida na capital."],
    ctas: ["Comprar agora", "Ver produtos", "Saiba mais"],
  },
};

const ADVERTISER_SEED: Array<Pick<Advertiser, "id" | "nome" | "nicho">> = [
  { id: "adv-01", nome: "Nébula Fitness (fictício)", nicho: "Fitness" },
  { id: "adv-02", nome: "Pulso Treinos (fictício)", nicho: "Fitness" },
  { id: "adv-03", nome: "Orla Beachwear (fictício)", nicho: "Moda" },
  { id: "adv-04", nome: "Prisma Idiomas (fictício)", nicho: "Educação" },
  { id: "adv-05", nome: "Bem Natural Cosméticos (fictício)", nicho: "Beleza" },
  { id: "adv-06", nome: "Rota Azul Viagens (fictício)", nicho: "Viagens" },
  { id: "adv-07", nome: "Casa Ipê Decor (fictício)", nicho: "Casa e Decoração" },
  { id: "adv-08", nome: "Trama Urbana (fictício)", nicho: "Moda" },
];

const PLATFORM_SETS: Platform[][] = [
  ["facebook", "instagram"],
  ["instagram"],
  ["facebook"],
  ["facebook", "instagram", "messenger"],
  ["facebook", "instagram", "audience_network"],
];

const FORMATS: AdFormat[] = ["imagem", "video", "carrossel", "imagem", "video"];

function pick<T>(rand: () => number, list: T[]): T {
  return list[Math.floor(rand() * list.length)];
}

export const demoAdvertisers: Advertiser[] = ADVERTISER_SEED.map((a) => ({
  ...a,
  workspaceId: DEMO_WORKSPACE_ID,
  dataSourceId: DEMO_SOURCE_ID,
  externalId: `demo-page-${a.id}`,
  urlPagina: null,
  isDemo: true,
}));

function generateAds(): Ad[] {
  const rand = createRandom(20261020);
  const ads: Ad[] = [];

  demoAdvertisers.forEach((advertiser, index) => {
    const copy = COPY_BY_NICHE[advertiser.nicho];
    const count = 10 + Math.floor(rand() * 14);
    // Anunciantes com índice maior começam a anunciar mais recentemente,
    // o que cria tendências diferentes entre concorrentes.
    const maxAgeDays = 140 - index * 8;

    for (let i = 0; i < count; i++) {
      const startOffset = Math.floor(rand() * maxAgeDays);
      const dataInicio = addDays(DEMO_REFERENCE_DATE, -startOffset);
      const duration = 7 + Math.floor(rand() * 70);
      const endDate = addDays(dataInicio, duration);
      const ativo = endDate >= DEMO_REFERENCE_DATE;
      const formato = pick(rand, FORMATS);
      const gancho = pick(rand, copy.ganchos);
      const oferta = pick(rand, copy.ofertas);
      const id = `ad-${advertiser.id.slice(4)}-${String(i + 1).padStart(2, "0")}`;

      ads.push({
        id,
        workspaceId: DEMO_WORKSPACE_ID,
        advertiserId: advertiser.id,
        dataSourceId: DEMO_SOURCE_ID,
        externalId: `demo-${id}`,
        contentHash: `demo-hash-${id}`,
        texto: `${gancho} ${oferta}`,
        titulo: oferta,
        cta: pick(rand, copy.ctas),
        linkDestino: null,
        formato,
        plataformas: pick(rand, PLATFORM_SETS),
        paises: ["BR"],
        dataInicio,
        dataFim: ativo ? null : endDate,
        ativo,
        criativoAutorizado: false,
        criativoUrl: null,
        disponibilidadeCampos: {
          texto: "disponivel",
          titulo: "disponivel",
          cta: "disponivel",
          link_destino: "vazio",
          formato: "disponivel",
          plataformas: "disponivel",
          data_inicio: "disponivel",
          data_fim: ativo ? "vazio" : "disponivel",
          criativo: "nao_fornecido_pela_fonte",
        },
        primeiraColeta: dataInicio,
        ultimaColeta: DEMO_REFERENCE_DATE,
        isDemo: true,
      });
    }
  });

  return ads;
}

export const demoAds: Ad[] = generateAds();

export const demoCompetitors: Competitor[] = [
  { id: "comp-01", nome: "Nébula Fitness (fictício)", nicho: "Fitness", advertiserIds: ["adv-01"], notas: null },
  { id: "comp-02", nome: "Pulso Treinos (fictício)", nicho: "Fitness", advertiserIds: ["adv-02"], notas: null },
  { id: "comp-03", nome: "Orla Beachwear (fictício)", nicho: "Moda", advertiserIds: ["adv-03"], notas: null },
  { id: "comp-04", nome: "Prisma Idiomas (fictício)", nicho: "Educação", advertiserIds: ["adv-04"], notas: null },
  { id: "comp-05", nome: "Trama Urbana (fictício)", nicho: "Moda", advertiserIds: ["adv-08"], notas: null },
].map((c) => ({ ...c, workspaceId: DEMO_WORKSPACE_ID, ativo: true, isDemo: true }));

export const demoSearches: Search[] = [
  { id: "srch-01", termos: "treino em casa", nicho: "Fitness", ultimaExecucao: "2026-10-20T09:12:00-03:00", totalResultados: 38, salva: true },
  { id: "srch-02", termos: "moda praia", nicho: "Moda", ultimaExecucao: "2026-10-19T16:40:00-03:00", totalResultados: 24, salva: true },
  { id: "srch-03", termos: "curso de inglês", nicho: "Educação", ultimaExecucao: "2026-10-18T11:05:00-03:00", totalResultados: 17, salva: false },
  { id: "srch-04", termos: "skincare natural", nicho: "Beleza", ultimaExecucao: "2026-10-17T14:22:00-03:00", totalResultados: 21, salva: true },
  { id: "srch-05", termos: "pacote de viagem", nicho: "Viagens", ultimaExecucao: "2026-10-15T10:30:00-03:00", totalResultados: 12, salva: false },
].map((s) => ({ ...s, workspaceId: DEMO_WORKSPACE_ID, dataSourceId: DEMO_SOURCE_ID, isDemo: true }));

export const demoImportRuns: ImportRun[] = [
  {
    id: "run-04",
    status: "concluida",
    inicio: "2026-10-20T08:00:00-03:00",
    fim: "2026-10-20T08:00:04-03:00",
    descricao: "Atualização dos dados de demonstração",
    totais: { novos: 9, atualizados: 41, duplicados: 3, erros: 0 },
  },
  {
    id: "run-03",
    status: "parcial",
    inicio: "2026-10-13T08:00:00-03:00",
    fim: "2026-10-13T08:00:06-03:00",
    descricao: "Atualização dos dados de demonstração",
    totais: { novos: 14, atualizados: 35, duplicados: 5, erros: 2 },
  },
  {
    id: "run-02",
    status: "concluida",
    inicio: "2026-10-06T08:00:00-03:00",
    fim: "2026-10-06T08:00:03-03:00",
    descricao: "Atualização dos dados de demonstração",
    totais: { novos: 11, atualizados: 30, duplicados: 1, erros: 0 },
  },
  {
    id: "run-01",
    status: "concluida",
    inicio: "2026-09-29T08:00:00-03:00",
    fim: "2026-09-29T08:00:09-03:00",
    descricao: "Carga inicial de demonstração",
    totais: { novos: 87, atualizados: 0, duplicados: 0, erros: 0 },
  },
].map((r) => ({ ...r, status: r.status as ImportRun["status"], workspaceId: DEMO_WORKSPACE_ID, dataSourceId: DEMO_SOURCE_ID, isDemo: true }));
