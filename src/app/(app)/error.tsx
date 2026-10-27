"use client";

import { ErrorState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";

export default function AppError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <ErrorState
      titulo="Não foi possível carregar esta página"
      descricao="Ocorreu um erro inesperado. Tente novamente; se o problema continuar, recarregue a página."
    >
      <Button onClick={() => retry()} size="sm">
        Tentar novamente
      </Button>
    </ErrorState>
  );
}
