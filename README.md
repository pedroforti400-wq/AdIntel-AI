# AdIntel AI

Aplicação web, em português, para pesquisa de mercado e inteligência competitiva sobre anúncios.

> ⚠️ **Fase atual: 3 — dados de DEMONSTRAÇÃO + importação dos seus próprios arquivos CSV/JSON.**
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

## O que já existe

**Fase 1**
- **Painel** com indicadores, evolução semanal, plataformas, formatos, concorrentes, pesquisas e importações recentes.
- **Barra lateral** com todas as seções planejadas. As seções ainda não construídas mostram o que vão oferecer e em qual fase.
- **Fontes de dados**: explica de onde vêm os dados, as limitações de cada fonte e quais filtros cada uma suporta.

**Fase 2**
- **Explorar anúncios** (`/explorar`): palavras-chave (sem diferenciar acentos), filtros de nicho, anunciante, plataforma, formato, situação e período, que podem ser combinados, além de ordenação e paginação. Filtros que a fonte não suporta aparecem desabilitados.
- **Biblioteca** (`/biblioteca`): lista de todos os anúncios e página de detalhes de cada um (`/biblioteca/<id>`), com texto, anunciante, formato, plataformas, datas, situação, fonte, link e disponibilidade de cada campo.
- **Concorrentes** (`/concorrentes`): lista com estatísticas, perfil individual com histórico semanal e anúncios associados, e comparação de 2 a 4 concorrentes (`/concorrentes/comparar`).
- Os criativos são sempre **prévias ilustrativas fictícias**. Nenhuma imagem real é usada sem autorização.

**Fase 3**
- **Importações** (`/importacoes`): envio de arquivos CSV ou JSON (até 2 MB e 5.000 linhas), escolhidos ou arrastados para a página. Depois vêm o mapeamento automático de colunas (ajustável), a pré-visualização com validação linha a linha e o resumo final (novos, atualizados, duplicados e rejeitados).
- **Deduplicação:** o mesmo anúncio não é cadastrado duas vezes. Ele é reconhecido pelo ID do anúncio ou, se não houver ID, por uma "impressão digital" do anunciante, texto, título, link e data de início (sem diferenciar maiúsculas, acentos ou espaços).
- Os anúncios importados aparecem no **Explorador** e na **Biblioteca** com o selo **Importado** e o filtro **Fonte dos dados**. O Painel e os Concorrentes continuam somente com os dados de demonstração.
- Há um modelo de arquivo para baixar em `/modelo-importacao.csv`.

### Onde ficam os anúncios importados

- Ficam no arquivo `.dados-locais/importacoes.json`, **somente neste computador**.
- Essa pasta está no `.gitignore`: **nunca vai para o GitHub**.
- Para apagar todos os importados, feche o servidor (`Ctrl + C`) e apague a pasta `.dados-locais`.
- Na Fase 4, este arquivo será substituído pelo banco de dados (Supabase).

### Segurança da importação

- O conteúdo do arquivo é lido apenas como texto: nada é executado.
- Tamanho, número de linhas e colunas são limitados. O servidor valida tudo de novo, sem confiar no navegador.
- Só são aceitos links `http://` e `https://`. Campos ausentes ficam vazios e não são inventados.
- Imagens e vídeos não são importados.
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
2. ✅ Telas completas com dados de demonstração (explorar, biblioteca, concorrentes)
3. ✅ Importação CSV/JSON com deduplicação
4. Banco de dados e login (Supabase)
5. Analisador com IA (fatos observados separados de hipóteses)
6. Relatórios em PDF e CSV
7. API oficial da Meta (somente dentro do escopo permitido)
8. Fornecedor licenciado, agendamentos e alertas
