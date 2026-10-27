# AdIntel AI

Aplicação web, em português, para pesquisa de mercado e inteligência competitiva sobre anúncios.

> ⚠️ **Fase atual: 1 — painel com dados de DEMONSTRAÇÃO.**
> Todos os anúncios, anunciantes, pesquisas e importações exibidos são **fictícios**.
> Eles **não representam pesquisas reais**, empresas reais nem anúncios veiculados.

---

## Como abrir o projeto no navegador

Você só precisa ter o **Node.js** instalado (versão 22 ou superior).

1. Abra o terminal (Prompt de Comando ou PowerShell) **dentro da pasta do projeto**:
   ```
   cd C:\Users\pedro\adintel-ai
   ```
2. Na primeira vez (ou se alguém mudar as dependências), instale as bibliotecas do projeto:
   ```
   npm install
   ```
3. Inicie o servidor de desenvolvimento:
   ```
   npm run dev
   ```
4. Espere aparecer a mensagem `Ready` e abra no navegador: **http://localhost:3000**
5. Para parar o servidor, volte ao terminal e pressione `Ctrl + C`.

## Comandos úteis

| Comando | O que faz |
|---|---|
| `npm run dev` | Abre o projeto para desenvolvimento em http://localhost:3000 |
| `npm test` | Roda os testes automáticos |
| `npm run lint` | Procura problemas de qualidade no código |
| `npm run typecheck` | Confere se os tipos do TypeScript estão corretos |
| `npm run build` | Gera a versão otimizada para publicação |

## O que já existe (Fase 1)

- **Painel** com indicadores, evolução semanal, plataformas, formatos, concorrentes, pesquisas e importações recentes.
- **Barra lateral** com todas as seções planejadas. As seções ainda não construídas mostram o que vão oferecer e em qual fase.
- **Fontes de dados**: explica de onde vêm os dados e as limitações de cada fonte.
- Tema claro e escuro, layout responsivo (computador e celular), telas de carregamento, erro e "não encontrado".
- Selo **DEMONSTRAÇÃO** em todas as telas.

## Sobre as fontes de dados

O sistema usa "provedores" (adaptadores) intercambiáveis:

| Fonte | Situação |
|---|---|
| Dados de demonstração | **Ativa** (somente dados fictícios) |
| Importação assistida CSV/JSON | Planejada para a Fase 3 |
| API oficial da Biblioteca de Anúncios da Meta | Não configurada. Cobertura **limitada**: não oferece acesso amplo a anúncios comerciais comuns do Brasil |
| Fornecedor licenciado | Não escolhido |

**Pré-requisito antes de qualquer integração real:** validar uma fonte autorizada para anúncios comerciais brasileiros.
O projeto **não** faz coleta automatizada não autorizada (scraping), não contorna CAPTCHAs ou bloqueios e não inventa integrações.

## Organização das pastas

```
src/
  app/                 Telas (cada pasta é um endereço, ex.: app/(app)/painel → /painel)
  components/
    ui/                Componentes visuais base (shadcn/ui)
    layout/            Barra lateral, cabeçalho, selo de demonstração, tema
    shared/            Estados vazio/erro/em construção, cabeçalho de página
    dashboard/         Peças do painel (cartões, gráfico, tabela)
  config/              Itens do menu
  data/
    repositories/      "Porta única" de acesso aos dados (as telas só falam com ela)
    demo/              Dados fictícios e sua implementação
  modules/
    ads/               Tipos do domínio (anúncio, anunciante, concorrente…)
    providers/         Contrato e lista das fontes de dados
  lib/                 Utilitários (formatação em pt-BR)
tests/                 Testes automáticos
```

Na Fase 4, o banco de dados (Supabase) entra **atrás** da pasta `data/repositories`, sem mudar as telas.

## Segurança

- Nenhuma chave secreta fica no código. O arquivo `.env.example` lista as variáveis futuras **sem valores**.
- Quando houver chaves, elas vão no arquivo `.env.local`, que **não** é enviado ao Git.
- Não cole chaves secretas em conversas, prints ou e-mails.

## Roadmap

1. ✅ Painel com dados de demonstração
2. Telas completas com dados de demonstração (explorar, biblioteca, concorrentes)
3. Importação CSV/JSON com deduplicação
4. Banco de dados e login (Supabase)
5. Analisador com IA (fatos observados separados de hipóteses)
6. Relatórios em PDF e CSV
7. API oficial da Meta (somente dentro do escopo permitido)
8. Fornecedor licenciado, agendamentos e alertas
