import { GalleryHorizontal, Image as ImageIcon, PlayCircle, Type } from "lucide-react";

import type { AdFormat } from "@/modules/ads/types";
import { FORMAT_LABELS } from "@/lib/format";
import { cn } from "@/lib/utils";

const ICONS = { imagem: ImageIcon, video: PlayCircle, carrossel: GalleryHorizontal, texto: Type } as const;

/**
 * Prévia ilustrativa e fictícia do anúncio.
 * Não é o criativo real: criativos só são exibidos quando houver autorização.
 */
export function CreativePlaceholder({
  formato,
  titulo,
  seed,
  className,
}: {
  formato: AdFormat | null;
  titulo: string | null;
  /** Usado para variar a cor de forma estável entre anúncios. */
  seed: string;
  className?: string;
}) {
  const Icon = formato ? ICONS[formato] : ImageIcon;
  const hue = [...seed].reduce((sum, c) => sum + c.charCodeAt(0), 0) % 5;

  return (
    <div
      className={cn("relative flex aspect-[16/9] flex-col justify-between overflow-hidden rounded-lg p-3", className)}
      style={{
        background: `linear-gradient(135deg, color-mix(in oklch, var(--chart-${hue + 1}) 30%, transparent), color-mix(in oklch, var(--chart-${((hue + 2) % 5) + 1}) 14%, transparent))`,
      }}
      role="img"
      aria-label="Prévia ilustrativa fictícia; o criativo real não está disponível"
    >
      <div className="flex items-center justify-between text-[10px] font-medium text-foreground/70">
        <span className="inline-flex items-center gap-1 rounded bg-background/70 px-1.5 py-0.5">
          <Icon className="size-3" aria-hidden />
          {formato ? FORMAT_LABELS[formato] : "Formato não informado"}
        </span>
        <span className="rounded bg-background/70 px-1.5 py-0.5">Prévia ilustrativa</span>
      </div>
      {titulo && <p className="line-clamp-2 text-sm font-semibold text-foreground/90">{titulo}</p>}
    </div>
  );
}
