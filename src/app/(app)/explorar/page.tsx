import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/shared/placeholder-page";

export const metadata: Metadata = { title: "Explorar anúncios" };

export default function ExplorarPage() {
  return (
    <PlaceholderPage
      titulo="Explorar anúncios"
      descricao="Pesquise anúncios por palavra-chave, nicho e anunciante."
      fase="Fase 2"
      recursos={[
        "Busca por palavra-chave, nicho e anunciante.",
        "Filtros de plataforma, status, período, formato e país.",
        "Filtros que a fonte selecionada não suporta aparecem desabilitados, com explicação.",
        "Salvar pesquisas para repetir depois.",
      ]}
    />
  );
}
