import {
  BarChart3,
  BellRing,
  Building2,
  Database,
  FileText,
  LayoutDashboard,
  Library,
  Search,
  Settings,
  Sparkles,
  Upload,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  titulo: string;
  href: string;
  icone: LucideIcon;
  /** Seção ainda em construção (mostra um selo na barra lateral). */
  emBreve?: boolean;
}

export interface NavGroup {
  titulo: string;
  itens: NavItem[];
}

export const NAVIGATION: NavGroup[] = [
  {
    titulo: "Visão geral",
    itens: [{ titulo: "Painel", href: "/painel", icone: LayoutDashboard }],
  },
  {
    titulo: "Pesquisa",
    itens: [
      { titulo: "Explorar anúncios", href: "/explorar", icone: Search },
      { titulo: "Biblioteca", href: "/biblioteca", icone: Library },
      { titulo: "Concorrentes", href: "/concorrentes", icone: Building2 },
    ],
  },
  {
    titulo: "Inteligência",
    itens: [
      { titulo: "Análises com IA", href: "/analises", icone: Sparkles, emBreve: true },
      { titulo: "Relatórios", href: "/relatorios", icone: FileText, emBreve: true },
    ],
  },
  {
    titulo: "Dados",
    itens: [
      { titulo: "Importações", href: "/importacoes", icone: Upload, emBreve: true },
      { titulo: "Fontes de dados", href: "/fontes", icone: Database },
      { titulo: "Alertas", href: "/agendamentos", icone: BellRing, emBreve: true },
    ],
  },
];

export const SECONDARY_NAVIGATION: NavItem[] = [
  { titulo: "Configurações", href: "/configuracoes", icone: Settings, emBreve: true },
];

export const BRAND = {
  nome: "AdIntel AI",
  icone: BarChart3,
};
