import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { DemoBanner } from "@/components/layout/demo-badge";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      {/* min-w-0 impede que tabelas e gráficos largos empurrem a página para os lados */}
      <SidebarInset className="min-w-0">
        <AppHeader />
        <DemoBanner />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-6 md:py-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
