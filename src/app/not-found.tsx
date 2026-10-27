import Link from "next/link";

import { EmptyState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-svh items-center justify-center px-4">
      <EmptyState
        className="w-full max-w-md"
        titulo="Página não encontrada"
        descricao="O endereço acessado não existe ou foi movido."
      >
        <Button asChild size="sm">
          <Link href="/painel">Ir para o painel</Link>
        </Button>
      </EmptyState>
    </div>
  );
}
