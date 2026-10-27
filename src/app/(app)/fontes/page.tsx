import type { Metadata } from "next";
import { CheckCircle2, Info, XCircle } from "lucide-react";

import { DemoBadge } from "@/components/layout/demo-badge";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PROVIDERS } from "@/modules/providers/registry";
import type { ProviderStatus, SearchFilter } from "@/modules/providers/types";

export const metadata: Metadata = { title: "Fontes de dados" };

const STATUS: Record<ProviderStatus, { rotulo: string; variant: "default" | "secondary" | "outline" }> = {
  ativo: { rotulo: "Ativa", variant: "default" },
  planejado: { rotulo: "Planejada", variant: "secondary" },
  nao_configurado: { rotulo: "Não configurada", variant: "outline" },
};

const FILTER_LABELS: Record<SearchFilter, string> = {
  palavra_chave: "Palavra-chave",
  anunciante: "Anunciante",
  nicho: "Nicho",
  plataforma: "Plataforma",
  status: "Status",
  periodo: "Período",
  formato: "Formato",
  pais: "País",
};

const ALL_FILTERS = Object.keys(FILTER_LABELS) as SearchFilter[];

export default function FontesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Fontes de dados"
        descricao="De onde vêm os anúncios exibidos no AdIntel AI e o que cada fonte consegue oferecer."
      />

      <Card className="border-primary/30 bg-accent/40">
        <CardContent className="flex gap-3 text-sm">
          <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          <div className="space-y-1">
            <p className="font-medium">Nesta fase, somente dados de demonstração estão ativos.</p>
            <p className="text-muted-foreground">
              O Explorador consulta os filtros suportados pela fonte ativa: filtros não suportados aparecem
              desabilitados, com explicação.
            </p>
            <p className="text-muted-foreground">
              Eles <strong>não representam pesquisas reais</strong>. Antes de qualquer integração, será preciso validar
              uma fonte autorizada para anúncios comerciais brasileiros. O AdIntel AI não faz coleta automatizada
              não autorizada nem tenta contornar controles de acesso de terceiros.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {PROVIDERS.map((p) => {
          const status = STATUS[p.status];
          return (
            <Card key={p.id}>
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-base">{p.nome}</CardTitle>
                  <Badge variant={status.variant}>{status.rotulo}</Badge>
                  {p.isDemo && <DemoBadge />}
                </div>
                <CardDescription>{p.descricao}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
                  <span>Previsão: {p.fase}</span>
                  <span className="inline-flex items-center gap-1">
                    {p.capacidades.buscaSobDemanda ? (
                      <CheckCircle2 className="size-3.5 text-success" />
                    ) : (
                      <XCircle className="size-3.5" />
                    )}
                    Busca sob demanda
                  </span>
                  <span className="inline-flex items-center gap-1">
                    {p.capacidades.importacaoArquivo ? (
                      <CheckCircle2 className="size-3.5 text-success" />
                    ) : (
                      <XCircle className="size-3.5" />
                    )}
                    Importação de arquivo
                  </span>
                </div>

                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Filtros suportados</p>
                  {p.capacidades.filtros.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {p.capacidades.filtros.map((f) => (
                        <Badge key={f} variant="secondary" className="font-normal">
                          {FILTER_LABELS[f]}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">A definir.</p>
                  )}
                </div>

                {p.capacidades.filtros.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">Filtros não suportados</p>
                    {ALL_FILTERS.some((f) => !p.capacidades.filtros.includes(f)) ? (
                      <div className="flex flex-wrap gap-1.5">
                        {ALL_FILTERS.filter((f) => !p.capacidades.filtros.includes(f)).map((f) => (
                          <Badge key={f} variant="outline" className="font-normal text-muted-foreground line-through">
                            {FILTER_LABELS[f]}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Nenhum: todos os filtros são suportados.</p>
                    )}
                  </div>
                )}

                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Limitações conhecidas</p>
                  <ul className="list-disc space-y-1 pl-4 text-muted-foreground">
                    {p.limitacoes.map((l) => (
                      <li key={l}>{l}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
