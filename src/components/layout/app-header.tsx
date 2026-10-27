import { Search } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "./theme-toggle";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-6">
      <SidebarTrigger className="-ml-1" aria-label="Abrir ou fechar menu" />
      <Separator orientation="vertical" className="mr-1 data-[orientation=vertical]:h-4" />

      <div className="relative hidden max-w-sm flex-1 sm:block">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          disabled
          placeholder="Buscar anúncios, anunciantes… (em breve)"
          aria-label="Busca global (disponível em breve)"
          className="h-9 w-full rounded-md border bg-muted/50 pr-3 pl-8 text-sm placeholder:text-muted-foreground disabled:cursor-not-allowed"
        />
      </div>

      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle />
        <Avatar className="size-8">
          <AvatarFallback className="bg-accent text-xs font-medium text-accent-foreground">VC</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
