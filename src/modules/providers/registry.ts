import type { ProviderInfo } from "./types";

/**
 * Lista das fontes de dados conhecidas pelo sistema.
 *
 * Importante: apenas a fonte "demo" está ativa nesta fase. As demais
 * estão descritas para deixar claro o que vem pela frente — nenhuma
 * integração externa foi implementada ou presumida.
 */
export const PROVIDERS: ProviderInfo[] = [
  {
    id: "demo",
    tipo: "demo",
    nome: "Dados de demonstração",
    descricao:
      "Anúncios e anunciantes fictícios gerados localmente para desenvolver e testar as telas. Não representam pesquisas reais nem empresas reais.",
    status: "ativo",
    fase: "Fase 1",
    limitacoes: [
      "Todos os dados são fictícios e identificados como DEMONSTRAÇÃO.",
      "Não devem ser usados para decisões de negócio.",
    ],
    capacidades: {
      filtros: ["palavra_chave", "anunciante", "nicho", "plataforma", "status", "periodo", "formato"],
      campos: ["texto", "titulo", "cta", "link_destino", "formato", "plataformas", "data_inicio", "data_fim"],
      buscaSobDemanda: true,
      importacaoArquivo: false,
    },
    isDemo: true,
  },
  {
    id: "importacao-arquivo",
    tipo: "importacao_arquivo",
    nome: "Importação assistida (CSV/JSON)",
    descricao:
      "Você envia um arquivo com anúncios que tem autorização para usar. O sistema mapeia as colunas, valida, remove duplicados e registra a origem.",
    status: "ativo",
    fase: "Fase 3",
    limitacoes: [
      "Os campos disponíveis dependem do conteúdo de cada arquivo.",
      "Você é responsável por ter direito de uso sobre os dados enviados.",
      "Nesta fase, os anúncios importados ficam guardados somente neste computador (pasta .dados-locais).",
      "Imagens e vídeos (criativos) não são importados.",
    ],
    capacidades: {
      filtros: ["palavra_chave", "anunciante", "nicho", "plataforma", "status", "periodo", "formato", "pais"],
      campos: ["texto", "titulo", "cta", "link_destino", "formato", "plataformas", "data_inicio", "data_fim"],
      buscaSobDemanda: false,
      importacaoArquivo: true,
    },
    isDemo: false,
  },
  {
    id: "meta-oficial",
    tipo: "meta_oficial",
    nome: "API oficial da Biblioteca de Anúncios da Meta",
    descricao:
      "Integração com a API oficial, usada somente dentro do escopo que a Meta permite e com credenciais suas, após verificação de identidade.",
    status: "nao_configurado",
    fase: "Fase 7",
    limitacoes: [
      "A API oficial NÃO oferece acesso amplo a anúncios comerciais comuns veiculados no Brasil.",
      "A cobertura é limitada a categorias específicas (como anúncios sobre temas sociais, eleições ou política) e a regiões específicas; o escopo exato será conferido na documentação oficial antes da implementação.",
      "Exige conta de desenvolvedor e verificação de identidade na Meta.",
    ],
    capacidades: {
      filtros: ["palavra_chave", "anunciante", "pais", "status", "periodo"],
      campos: [],
      buscaSobDemanda: true,
      importacaoArquivo: false,
    },
    isDemo: false,
  },
  {
    id: "fornecedor-licenciado",
    tipo: "fornecedor_licenciado",
    nome: "Fornecedor licenciado de dados",
    descricao:
      "Espaço reservado para um fornecedor externo com licença para anúncios comerciais brasileiros. Nenhum fornecedor foi escolhido ainda.",
    status: "nao_configurado",
    fase: "A definir",
    limitacoes: [
      "Pré-requisito: validar uma fonte autorizada para anúncios comerciais brasileiros antes de qualquer integração.",
      "Capacidades, custos e termos dependem do fornecedor escolhido.",
    ],
    capacidades: {
      filtros: [],
      campos: [],
      buscaSobDemanda: false,
      importacaoArquivo: false,
    },
    isDemo: false,
  },
];

export function getProviderInfo(id: string): ProviderInfo | undefined {
  return PROVIDERS.find((p) => p.id === id);
}
