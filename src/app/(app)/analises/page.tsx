import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/shared/placeholder-page";

export const metadata: Metadata = { title: "Análises com IA" };

export default function AnalisesPage() {
  return (
    <PlaceholderPage
      titulo="Análises com IA"
      descricao="Leitura de copy, gancho, oferta, CTA, formato e posicionamento."
      fase="Fase 5"
      recursos={[
        "Fatos observados e hipóteses da IA exibidos separadamente.",
        "Cada hipótese acompanha nível de confiança e justificativa.",
        "Faturamento, ROAS ou vendas nunca são apresentados como fatos.",
        "Modo de demonstração sem custo, sem precisar de chave de API.",
      ]}
    />
  );
}
