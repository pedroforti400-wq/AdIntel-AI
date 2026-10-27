"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { BRAND, NAVIGATION, SECONDARY_NAVIGATION, type NavItem } from "@/config/navigation";

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const { isMobile, setOpenMobile } = useSidebar();
  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
  const Icon = item.icone;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive} tooltip={item.titulo}>
        <Link href={item.href} onClick={() => isMobile && setOpenMobile(false)}>
          <Icon />
          <span>{item.titulo}</span>
        </Link>
      </SidebarMenuButton>
      {item.emBreve && (
        <SidebarMenuBadge className="text-[10px] font-normal text-muted-foreground">
          em breve
        </SidebarMenuBadge>
      )}
    </SidebarMenuItem>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const BrandIcon = BRAND.icone;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/painel">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                  <BrandIcon className="size-4" />
                </div>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate font-semibold">{BRAND.nome}</span>
                  <span className="truncate text-xs text-muted-foreground">Inteligência competitiva</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {NAVIGATION.map((group) => (
          <SidebarGroup key={group.titulo}>
            <SidebarGroupLabel>{group.titulo}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.itens.map((item) => (
                  <NavLink key={item.href} item={item} pathname={pathname} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          {SECONDARY_NAVIGATION.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
