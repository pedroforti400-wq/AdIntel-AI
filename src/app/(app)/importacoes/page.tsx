import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/shared/placeholder-page";

export const metadata: Metadata = { title: "Importações" };

export default function ImportacoesPage() {
  return (
    <PlaceholderPage
      titulo="Importações"
      descricao="Envie arquivos CSV ou JSON com anúncios que você tem autorização para usar."
      fase="Fase 3"
      recursos={[
        "Envio de CSV/JSON com mapeamento de colunas e pré-visualização.",
        "Deduplicação automática: o mesmo anúncio não é cadastrado duas vezes.",
        "Resumo de cada execução: novos, atualizados, duplicados e erros.",
      ]}
    />
  );
}
