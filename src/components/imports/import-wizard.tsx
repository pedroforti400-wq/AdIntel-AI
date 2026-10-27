"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  FileJson,
  FileSpreadsheet,
  FileUp,
  Loader2,
  RefreshCw,
  Sparkles,
  XCircle,
} from "lucide-react";

import { Field, NativeSelect } from "@/components/shared/native-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ImportSummary } from "@/modules/imports/engine";
import { IMPORT_LIMITS, formatBytes, formatFromFileName, type ImportFormat } from "@/modules/imports/limits";
import {
  TARGET_FIELDS,
  TARGET_FIELD_INFO,
  mappingErrors,
  suggestMapping,
  type ColumnMapping,
} from "@/modules/imports/mapping";
import { normalizeRecord } from "@/modules/imports/normalize";
import { parseImportFile, type ParsedTable } from "@/modules/imports/parse";
import { FORMAT_LABELS, PLATFORM_LABELS, formatDate, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

type Step =
  | { etapa: "selecionar"; erro?: string }
  | { etapa: "mapear"; arquivo: File; formato: ImportFormat; tabela: ParsedTable; erroEnvio?: string }
  | { etapa: "resultado"; resumo: ImportSummary };

const PREVIEW_ROWS = 5;

/**
 * Assistente de importação (roda no navegador).
 * A leitura aqui serve só para a pré-visualização; o servidor valida tudo de novo ao importar.
 */
export function ImportWizard() {
  const [step, setStep] = useState<Step>({ etapa: "selecionar" });
  const [mapping, setMapping] = useState<ColumnMapping | null>(null);
  const [enviando, setEnviando] = useState(false);
  const router = useRouter();

  async function handleFile(file: File) {
    const formato = formatFromFileName(file.name);
    if (!formato) return setStep({ etapa: "selecionar", erro: "Formato não aceito. Escolha um arquivo .csv ou .json." });
    if (file.size === 0) return setStep({ etapa: "selecionar", erro: "O arquivo está vazio." });
    if (file.size > IMPORT_LIMITS.maxBytes) {
      return setStep({ etapa: "selecionar", erro: `O arquivo passa do limite de 2 MB (tamanho: ${formatBytes(file.size)}). Divida-o em arquivos menores.` });
    }
    let text: string;
    try {
      text = await file.text();
    } catch {
      return setStep({ etapa: "selecionar", erro: "Não foi possível ler o arquivo." });
    }
    const parsed = parseImportFile(text, formato);
    if (!parsed.ok) return setStep({ etapa: "selecionar", erro: parsed.erro });
    setMapping(suggestMapping(parsed.tabela.colunas));
    setStep({ etapa: "mapear", arquivo: file, formato, tabela: parsed.tabela });
  }

  async function handleImport() {
    if (step.etapa !== "mapear" || !mapping) return;
    setEnviando(true);
    try {
      const body = new FormData();
      body.set("arquivo", step.arquivo);
      body.set("mapeamento", JSON.stringify(mapping));
      const response = await fetch("/api/importacoes", { method: "POST", body });
      const data = (await response.json().catch(() => null)) as
        | { ok: true; resumo: ImportSummary }
        | { ok: false; erro: string }
        | null;
      if (!data) throw new Error("Resposta inesperada do servidor.");
      if (!data.ok) {
        setStep({ ...step, erroEnvio: data.erro });
        return;
      }
      setStep({ etapa: "resultado", resumo: data.resumo });
      router.refresh();
    } catch {
      setStep({ ...step, erroEnvio: "Não foi possível concluir a importação. Verifique se o servidor está rodando e tente de novo." });
    } finally {
      setEnviando(false);
    }
  }

  function reset() {
    setMapping(null);
    setStep({ etapa: "selecionar" });
  }

  return (
    <div className="space-y-4">
      <StepIndicator atual={step.etapa} />
      {step.etapa === "selecionar" && <FileDropzone onFile={handleFile} erro={step.erro} />}
      {step.etapa === "mapear" && mapping && (
        <MappingStep
          arquivo={step.arquivo}
          formato={step.formato}
          tabela={step.tabela}
          mapping={mapping}
          onChange={setMapping}
          onCancel={reset}
          onImport={handleImport}
          enviando={enviando}
          erroEnvio={step.erroEnvio}
        />
      )}
      {step.etapa === "resultado" && <ResultStep resumo={step.resumo} onRestart={reset} />}
    </div>
  );
}

function StepIndicator({ atual }: { atual: Step["etapa"] }) {
  const steps = [
    { id: "selecionar", rotulo: "1. Escolher arquivo" },
    { id: "mapear", rotulo: "2. Mapear e revisar" },
    { id: "resultado", rotulo: "3. Resultado" },
  ] as const;
  const index = steps.findIndex((s) => s.id === atual);
  return (
    <ol className="flex flex-wrap gap-2 text-xs" aria-label="Etapas da importação">
      {steps.map((s, i) => (
        <li
          key={s.id}
          aria-current={i === index ? "step" : undefined}
          className={cn(
            "rounded-full border px-3 py-1",
            i === index ? "border-primary bg-accent font-medium text-accent-foreground" : "text-muted-foreground",
            i < index && "border-success/40 text-success",
          )}
        >
          {s.rotulo}
        </li>
      ))}
    </ol>
  );
}

function FileDropzone({ onFile, erro }: { onFile: (file: File) => void; erro?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [arrastando, setArrastando] = useState(false);

  return (
    <Card className="py-0">
      <CardContent className="p-4 md:p-6">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setArrastando(true);
          }}
          onDragLeave={() => setArrastando(false)}
          onDrop={(e) => {
            e.preventDefault();
            setArrastando(false);
            const file = e.dataTransfer.files[0];
            if (file) onFile(file);
          }}
          className={cn(
            "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors",
            arrastando ? "border-primary bg-accent/60" : "border-border",
          )}
        >
          <div className="flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <FileUp className="size-6" aria-hidden />
          </div>
          <div className="space-y-1">
            <p className="font-medium">Arraste um arquivo para cá</p>
            <p className="text-sm text-muted-foreground">
              CSV ou JSON · até 2 MB · até {formatNumber(IMPORT_LIMITS.maxRows)} linhas
            </p>
          </div>
          <Button type="button" onClick={() => inputRef.current?.click()}>
            Escolher arquivo
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.json,text/csv,application/json"
            className="sr-only"
            aria-label="Escolher arquivo CSV ou JSON"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onFile(file);
              e.target.value = "";
            }}
          />
        </div>
        {erro && (
          <p role="alert" className="mt-4 flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <XCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
            {erro}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function MappingStep({
  arquivo,
  formato,
  tabela,
  mapping,
  onChange,
  onCancel,
  onImport,
  enviando,
  erroEnvio,
}: {
  arquivo: File;
  formato: ImportFormat;
  tabela: ParsedTable;
  mapping: ColumnMapping;
  onChange: (m: ColumnMapping) => void;
  onCancel: () => void;
  onImport: () => void;
  enviando: boolean;
  erroEnvio?: string;
}) {
  const errors = mappingErrors(mapping);
  const results = useMemo(() => tabela.linhas.map((row) => normalizeRecord(row, mapping)), [tabela, mapping]);
  const validas = results.filter((r) => r.ok).length;
  const firstLine = formato === "csv" ? 2 : 1;
  const FileIcon = formato === "csv" ? FileSpreadsheet : FileJson;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <FileIcon className="size-5" aria-hidden />
              </div>
              <div className="min-w-0">
                <CardTitle className="truncate text-base">{arquivo.name}</CardTitle>
                <CardDescription>
                  {formato.toUpperCase()} · {formatBytes(arquivo.size)} · {formatNumber(tabela.linhas.length)} linhas ·{" "}
                  {tabela.colunas.length} colunas
                </CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onCancel} disabled={enviando}>
              <RefreshCw /> Escolher outro arquivo
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="size-4 text-muted-foreground" aria-hidden /> Mapeamento de colunas
          </CardTitle>
          <CardDescription>
            Indique qual coluna do arquivo corresponde a cada campo. Sugerimos automaticamente pelos nomes; revise antes
            de importar. Campos sem coluna ficam como “não fornecido pela fonte”.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {TARGET_FIELDS.map((field) => {
              const info = TARGET_FIELD_INFO[field];
              return (
                <Field key={field} label={`${info.rotulo}${info.obrigatorio ? " *" : ""}`} htmlFor={`map-${field}`} hint={info.dica}>
                  <NativeSelect
                    id={`map-${field}`}
                    value={mapping[field]}
                    onChange={(e) => onChange({ ...mapping, [field]: e.target.value })}
                    disabled={enviando}
                  >
                    <option value="">— Não usar —</option>
                    {tabela.colunas.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </NativeSelect>
                </Field>
              );
            })}
          </div>
          {errors.length > 0 && (
            <ul role="alert" className="mt-4 space-y-1 rounded-lg bg-warning/10 px-3 py-2 text-sm text-warning-foreground">
              {errors.map((e) => (
                <li key={e} className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden /> {e}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pré-visualização</CardTitle>
          <CardDescription>
            Primeiras {Math.min(PREVIEW_ROWS, tabela.linhas.length)} linhas como serão gravadas.{" "}
            <strong className="text-foreground">{formatNumber(validas)}</strong> de {formatNumber(results.length)} linhas
            válidas. Anúncios repetidos são identificados no momento da importação.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Linha</TableHead>
                <TableHead>Anunciante</TableHead>
                <TableHead>Texto ou título</TableHead>
                <TableHead className="hidden md:table-cell">Formato</TableHead>
                <TableHead className="hidden lg:table-cell">Plataformas</TableHead>
                <TableHead className="hidden md:table-cell">Início</TableHead>
                <TableHead>Validação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.slice(0, PREVIEW_ROWS).map((r, i) => (
                <TableRow key={i}>
                  <TableCell className="text-muted-foreground tabular-nums">{firstLine + i}</TableCell>
                  {r.ok ? (
                    <>
                      <TableCell className="max-w-40 truncate font-medium">{r.anuncio.anunciante}</TableCell>
                      <TableCell className="max-w-64 truncate">{r.anuncio.texto ?? r.anuncio.titulo ?? "—"}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {r.anuncio.formato ? FORMAT_LABELS[r.anuncio.formato] : "—"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {r.anuncio.plataformas.map((p) => PLATFORM_LABELS[p]).join(", ") || "—"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {r.anuncio.dataInicio ? formatDate(r.anuncio.dataInicio) : "—"}
                      </TableCell>
                      <TableCell>
                        {r.avisos.length > 0 ? (
                          <span title={r.avisos.join("\n")} className="inline-flex items-center gap-1 text-xs text-warning-foreground">
                            <AlertTriangle className="size-3.5" /> {r.avisos.length} aviso{r.avisos.length > 1 ? "s" : ""}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-success">
                            <CheckCircle2 className="size-3.5" /> OK
                          </span>
                        )}
                      </TableCell>
                    </>
                  ) : (
                    <TableCell colSpan={6} className="text-xs text-destructive">
                      <span className="inline-flex items-center gap-1">
                        <XCircle className="size-3.5" /> Rejeitada: {r.motivo}
                      </span>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <PreviewWarnings results={results} firstLine={firstLine} />
        </CardContent>
      </Card>

      {erroEnvio && (
        <p role="alert" className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <XCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {erroEnvio}
        </p>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={onCancel} disabled={enviando}>Cancelar</Button>
        <Button onClick={onImport} disabled={enviando || errors.length > 0 || validas === 0}>
          {enviando ? <Loader2 className="animate-spin" /> : <FileUp />}
          {enviando ? "Importando…" : `Importar ${formatNumber(validas)} ${validas === 1 ? "linha válida" : "linhas válidas"}`}
        </Button>
      </div>
    </div>
  );
}

/** Lista resumida dos avisos e rejeições do arquivo inteiro (não só das linhas da prévia). */
function PreviewWarnings({ results, firstLine }: { results: ReturnType<typeof normalizeRecord>[]; firstLine: number }) {
  const issues = results
    .map((r, i) => ({ linha: firstLine + i, texto: r.ok ? r.avisos.join(" ") : `Rejeitada: ${r.motivo}`, rejeitada: !r.ok }))
    .filter((x) => x.texto);
  if (issues.length === 0) return null;
  return (
    <details className="mt-4 rounded-lg border px-3 py-2 text-sm">
      <summary className="cursor-pointer font-medium">
        {formatNumber(issues.length)} {issues.length === 1 ? "linha com aviso ou rejeição" : "linhas com avisos ou rejeições"}
      </summary>
      <ul className="mt-2 max-h-60 space-y-1 overflow-auto text-xs text-muted-foreground">
        {issues.slice(0, 100).map((x) => (
          <li key={x.linha} className={cn(x.rejeitada && "text-destructive")}>
            Linha {x.linha}: {x.texto}
          </li>
        ))}
      </ul>
    </details>
  );
}

function ResultStep({ resumo, onRestart }: { resumo: ImportSummary; onRestart: () => void }) {
  const cards = [
    { rotulo: "Novos", valor: resumo.novos, icone: Sparkles, cor: "text-success", dica: "Anúncios que ainda não existiam." },
    { rotulo: "Atualizados", valor: resumo.atualizados, icone: RefreshCw, cor: "text-primary", dica: "Já existiam e tiveram campos alterados." },
    { rotulo: "Duplicados", valor: resumo.duplicados, icone: Copy, cor: "text-muted-foreground", dica: "Repetidos, sem mudanças." },
    { rotulo: "Rejeitados", valor: resumo.rejeitados, icone: XCircle, cor: "text-destructive", dica: "Linhas inválidas, não gravadas." },
  ];
  const { execucao } = resumo;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>Importação concluída</CardTitle>
            <Badge variant={execucao.status === "concluida" ? "default" : "secondary"}>
              {execucao.status === "concluida" ? "Concluída" : execucao.status === "parcial" ? "Parcial" : "Nenhum anúncio gravado"}
            </Badge>
          </div>
          <CardDescription>
            {execucao.arquivo} · {formatNumber(execucao.totalLinhas)} linhas lidas
            {execucao.avisos > 0 && ` · ${formatNumber(execucao.avisos)} avisos`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {cards.map((c) => (
              <div key={c.rotulo} className="rounded-xl border p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{c.rotulo}</span>
                  <c.icone className={cn("size-4", c.cor)} aria-hidden />
                </div>
                <p className="mt-2 text-2xl font-semibold tabular-nums">{formatNumber(c.valor)}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{c.dica}</p>
              </div>
            ))}
          </div>

          {execucao.rejeitadas.length > 0 && (
            <details className="rounded-lg border px-3 py-2 text-sm">
              <summary className="cursor-pointer font-medium">Ver linhas rejeitadas</summary>
              <ul className="mt-2 max-h-60 space-y-1 overflow-auto text-xs text-muted-foreground">
                {execucao.rejeitadas.map((r) => (
                  <li key={r.linha}>Linha {r.linha}: {r.motivo}</li>
                ))}
              </ul>
            </details>
          )}

          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/explorar?fonte=importacao-arquivo">Ver no Explorador</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/biblioteca?fonte=importacao-arquivo">Ver na Biblioteca</Link>
            </Button>
            <Button variant="ghost" onClick={onRestart}>
              <FileUp /> Importar outro arquivo
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
