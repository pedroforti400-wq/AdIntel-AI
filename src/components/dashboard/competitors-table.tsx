import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/states";
import type { CompetitorRow } from "@/data/repositories/types";
import { formatChange, formatDate, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

export function CompetitorsTable({ rows }: { rows: CompetitorRow[] }) {
  if (rows.length === 0) {
    return (
      <EmptyState
        titulo="Nenhum concorrente monitorado"
        descricao="Cadastre concorrentes para acompanhar a evolução dos anúncios deles."
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Concorrente</TableHead>
          <TableHead className="hidden sm:table-cell">Nicho</TableHead>
          <TableHead className="text-right">Ativos</TableHead>
          <TableHead className="text-right">vs. 4 semanas</TableHead>
          <TableHead className="hidden text-right md:table-cell">Novos (30 dias)</TableHead>
          <TableHead className="hidden text-right lg:table-cell">Última coleta</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => {
          const change = formatChange(row.anunciosAtivos, row.anunciosAtivosPeriodoAnterior);
          return (
            <TableRow key={row.id}>
              <TableCell className="font-medium">{row.nome}</TableCell>
              <TableCell className="hidden sm:table-cell">
                <Badge variant="secondary" className="font-normal">{row.nicho}</Badge>
              </TableCell>
              <TableCell className="text-right tabular-nums">{formatNumber(row.anunciosAtivos)}</TableCell>
              <TableCell
                className={cn(
                  "text-right text-xs font-medium tabular-nums",
                  change?.startsWith("-") ? "text-destructive" : change ? "text-success" : "text-muted-foreground",
                )}
              >
                {change ?? "—"}
              </TableCell>
              <TableCell className="hidden text-right tabular-nums md:table-cell">
                {formatNumber(row.novosUltimos30Dias)}
              </TableCell>
              <TableCell className="hidden text-right text-muted-foreground lg:table-cell">
                {row.ultimaColeta ? formatDate(row.ultimaColeta) : "—"}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
