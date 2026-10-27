import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/shared/placeholder-page";

export const metadata: Metadata = { title: "Biblioteca" };

export default function BibliotecaPage() {
  return (
    <PlaceholderPage
      titulo="Biblioteca de anúncios"
      descricao="Todos os anúncios coletados, com origem e histórico."
      fase="Fase 2"
      recursos={[
        "Cartões com texto, título, CTA, link, datas e plataformas.",
        "Criativos exibidos somente quando houver autorização.",
        "Origem dos dados e campos indisponíveis sinalizados em cada anúncio.",
        "Histórico de observações de cada anúncio ao longo do tempo.",
      ]}
    />
  );
}
