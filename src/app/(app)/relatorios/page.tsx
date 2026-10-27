import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/shared/placeholder-page";

export const metadata: Metadata = { title: "Relatórios" };

export default function RelatoriosPage() {
  return (
    <PlaceholderPage
      titulo="Relatórios"
      descricao="Relatórios de mercado e de concorrência."
      fase="Fase 6"
      recursos={[
        "Relatório de mercado por nicho e de concorrência por anunciante.",
        "Exportação em CSV e impressão em PDF.",
        "Origem dos dados registrada em cada relatório.",
      ]}
    />
  );
}
