import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/shared/placeholder-page";

export const metadata: Metadata = { title: "Configurações" };

export default function ConfiguracoesPage() {
  return (
    <PlaceholderPage
      titulo="Configurações"
      descricao="Perfil, espaço de trabalho e preferências."
      fase="Fase 4"
      recursos={[
        "Perfil do usuário e membros do espaço de trabalho.",
        "Configuração do provedor de IA. As chaves ficam somente no servidor e nunca são exibidas.",
      ]}
    />
  );
}
