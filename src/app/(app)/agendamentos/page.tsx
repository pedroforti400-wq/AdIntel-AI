import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/shared/placeholder-page";

export const metadata: Metadata = { title: "Agendamentos e alertas" };

export default function AgendamentosPage() {
  return (
    <PlaceholderPage
      titulo="Agendamentos e alertas"
      descricao="Atualizações automáticas e avisos sobre mudanças nos concorrentes."
      fase="Fase 8 (futuro)"
      recursos={[
        "Atualização periódica de pesquisas e concorrentes, quando houver uma fonte autorizada.",
        "Alertas quando um concorrente lançar ou encerrar anúncios.",
      ]}
    />
  );
}
