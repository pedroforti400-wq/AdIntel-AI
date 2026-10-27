import { PageHeader } from "./page-header";
import { ComingSoon } from "./states";

/** Página padrão para seções ainda não implementadas. */
export function PlaceholderPage({
  titulo,
  descricao,
  fase,
  recursos,
}: {
  titulo: string;
  descricao: string;
  fase: string;
  recursos: string[];
}) {
  return (
    <div className="space-y-6">
      <PageHeader titulo={titulo} descricao={descricao} />
      <ComingSoon fase={fase} recursos={recursos} />
    </div>
  );
}
