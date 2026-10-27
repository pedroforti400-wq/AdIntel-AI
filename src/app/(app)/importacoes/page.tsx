import type { Metadata } from "next";
import { Suspense } from "react";
import { Download, ShieldCheck } from "lucide-react";

import { ImportWizard } from "@/components/imports/import-wizard";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { importedCounts, listImportRuns } from "@/data/repositories";
import { IMPORT_STATUS_LABELS, formatDateTime, formatNumber } from "@/lib/format";

export const metadata: Metadata = { title: "Importações" };

export default function ImportacoesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Importações"
        descricao="Envie arquivos CSV ou JSON com anúncios que você tem autorização para usar. Eles passam a aparecer no Explorador e na Biblioteca com o selo Importado."
        acoes={
          <Button asChild variant="outline" size="sm">
            <a href="/modelo-importacao.csv" download>
              <Download /> Baixar modelo CSV
            </a>
          </Button>
        }
      />

      <Card className="border-primary/30 bg-accent/40 py-0">
        <CardContent className="flex gap-3 p-4 text-sm">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          <div className="space-y-1 text-muted-foreground">
            <p>
              <strong className="text-foreground">Seus dados ficam neste computador.</strong> Os anúncios importados são
              guardados na pasta <code>.dados-locais</code> do projeto, que não é enviada ao GitHub.
            </p>
            <p>
              O conteúdo do arquivo é lido apenas como texto: nada é executado. Campos ausentes não são inventados e
              links só são aceitos com http:// ou https://.
            </p>
          </div>
        </CardContent>
      </Card>

      <ImportWizard />

      <Suspense fallback={<Skeleton className="h-48 rounded-xl" />}>
        <ImportHistory />
      </Suspense>
    </div>
  );
}

async function ImportHistory() {
  const [runs, counts] = await Promise.all([listImportRuns(), importedCounts()]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de importações</CardTitle>
        <CardDescription>
          {formatNumber(counts.anuncios)} anúncios e {formatNumber(counts.anunciantes)} anunciantes importados no total.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {runs.length === 0 ? (
          <EmptyState titulo="Nenhuma importação ainda" descricao="Quando você importar um arquivo, o resultado aparecerá aqui." />
        ) : (
          <ul className="divide-y">
            {runs.slice(0, 20).map((run) => (
              <li key={run.id} className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 truncate text-sm font-medium">
                    {run.arquivo}
                    <Badge variant="secondary" className="font-normal">{run.formato.toUpperCase()}</Badge>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {IMPORT_STATUS_LABELS[run.status]} · {formatDateTime(run.inicio)} · {formatNumber(run.totalLinhas)} linhas
                  </p>
                </div>
                <p className="text-xs text-muted-foreground tabular-nums">
                  <span className="font-medium text-foreground">{run.totais.novos}</span> novos · {run.totais.atualizados}{" "}
                  atualizados · {run.totais.duplicados} duplicados
                  {run.totais.erros > 0 && <span className="text-destructive"> · {run.totais.erros} rejeitados</span>}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
