import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/** Situação conhecida do anúncio na última coleta. `null` = a fonte não informou. */
export function AdStatusBadge({ ativo, className }: { ativo: boolean | null; className?: string }) {
  if (ativo === null) {
    return (
      <Badge variant="outline" className={cn("gap-1 font-medium text-muted-foreground", className)}>
        <span className="size-1.5 rounded-full border border-muted-foreground" aria-hidden />
        Situação não informada
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 font-medium",
        ativo ? "border-success/40 text-success" : "text-muted-foreground",
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", ativo ? "bg-success" : "bg-muted-foreground")} aria-hidden />
      {ativo ? "Ativo" : "Encerrado"}
    </Badge>
  );
}
