import type { ReactNode } from "react";
import { AlertTriangle, Construction, Inbox, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

function StateShell({
  icone: Icon,
  titulo,
  descricao,
  children,
  tom = "neutro",
  className,
}: {
  icone: LucideIcon;
  titulo: string;
  descricao?: ReactNode;
  children?: ReactNode;
  tom?: "neutro" | "erro";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-12 text-center",
        className,
      )}
    >
      <div
        className={cn(
          "flex size-11 items-center justify-center rounded-full",
          tom === "erro" ? "bg-destructive/10 text-destructive" : "bg-accent text-accent-foreground",
        )}
      >
        <Icon className="size-5" aria-hidden />
      </div>
      <div className="space-y-1">
        <p className="font-medium">{titulo}</p>
        {descricao && <div className="mx-auto max-w-md text-sm text-muted-foreground">{descricao}</div>}
      </div>
      {children}
    </div>
  );
}

/** Estado vazio: não há dados para mostrar. */
export function EmptyState(props: { titulo: string; descricao?: ReactNode; children?: ReactNode; className?: string }) {
  return <StateShell icone={Inbox} {...props} />;
}

/** Estado de erro: algo deu errado ao carregar. */
export function ErrorState(props: { titulo: string; descricao?: ReactNode; children?: ReactNode; className?: string }) {
  return <StateShell icone={AlertTriangle} tom="erro" {...props} />;
}

/** Seção planejada, ainda não construída. */
export function ComingSoon({
  fase,
  recursos,
}: {
  fase: string;
  recursos: string[];
}) {
  return (
    <StateShell
      icone={Construction}
      titulo={`Em construção — previsto para a ${fase}`}
      descricao="Esta seção já faz parte da navegação, mas ainda não foi implementada. Veja o que ela vai oferecer:"
    >
      <ul className="mt-1 grid w-full max-w-md gap-2 text-left text-sm">
        {recursos.map((r) => (
          <li key={r} className="flex items-start gap-2 rounded-lg bg-muted/60 px-3 py-2">
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
            <span>{r}</span>
          </li>
        ))}
      </ul>
    </StateShell>
  );
}
