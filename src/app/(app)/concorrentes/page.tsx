import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/shared/placeholder-page";

export const metadata: Metadata = { title: "Concorrentes" };

export default function ConcorrentesPage() {
  return (
    <PlaceholderPage
      titulo="Concorrentes"
      descricao="Cadastre e acompanhe concorrentes ao longo do tempo."
      fase="Fase 2"
      recursos={[
        "Cadastro de concorrentes com suas páginas e nicho.",
        "Linha do tempo de anúncios novos e encerrados.",
        "Comparação histórica entre dois ou mais concorrentes.",
      ]}
    />
  );
}
