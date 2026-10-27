import { CheckCircle2, CircleDashed, CircleSlash } from "lucide-react";

import type { AdField, FieldAvailability, FieldStatus } from "@/modules/ads/types";
import { FIELD_LABELS, FIELD_STATUS_LABELS } from "@/lib/format";
import { cn } from "@/lib/utils";

const ICONS: Record<FieldStatus, { icon: typeof CheckCircle2; className: string }> = {
  disponivel: { icon: CheckCircle2, className: "text-success" },
  vazio: { icon: CircleDashed, className: "text-muted-foreground" },
  nao_fornecido_pela_fonte: { icon: CircleSlash, className: "text-warning-foreground" },
};

/** Mostra, campo a campo, o que a fonte entregou ou não. */
export function FieldAvailabilityList({ disponibilidade }: { disponibilidade: FieldAvailability }) {
  const fields = Object.keys(FIELD_LABELS) as AdField[];

  return (
    <ul className="divide-y text-sm">
      {fields.map((field) => {
        const status = disponibilidade[field] ?? "nao_fornecido_pela_fonte";
        const { icon: Icon, className } = ICONS[status];
        return (
          <li key={field} className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0">
            <span>{FIELD_LABELS[field]}</span>
            <span className={cn("inline-flex items-center gap-1.5 text-xs", className)}>
              <Icon className="size-3.5" aria-hidden />
              {FIELD_STATUS_LABELS[status]}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
