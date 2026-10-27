import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Navegação entre páginas. Mantém os demais parâmetros da URL (filtros),
 * trocando só o número da página.
 */
export function Pagination({
  basePath,
  params,
  pagina,
  totalPaginas,
}: {
  basePath: string;
  params: URLSearchParams;
  pagina: number;
  totalPaginas: number;
}) {
  if (totalPaginas <= 1) return null;

  function hrefFor(target: number) {
    const next = new URLSearchParams(params);
    if (target <= 1) next.delete("pagina");
    else next.set("pagina", String(target));
    const qs = next.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  return (
    <nav aria-label="Paginação" className="flex items-center justify-between gap-2">
      {pagina > 1 ? (
        <Button asChild variant="outline" size="sm">
          <Link href={hrefFor(pagina - 1)}>
            <ChevronLeft /> Anterior
          </Link>
        </Button>
      ) : (
        <Button variant="outline" size="sm" disabled>
          <ChevronLeft /> Anterior
        </Button>
      )}

      <span className="text-sm text-muted-foreground tabular-nums">
        Página {pagina} de {totalPaginas}
      </span>

      {pagina < totalPaginas ? (
        <Button asChild variant="outline" size="sm">
          <Link href={hrefFor(pagina + 1)}>
            Próxima <ChevronRight />
          </Link>
        </Button>
      ) : (
        <Button variant="outline" size="sm" disabled>
          Próxima <ChevronRight />
        </Button>
      )}
    </nav>
  );
}
