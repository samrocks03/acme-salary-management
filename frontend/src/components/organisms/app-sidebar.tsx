"use client";

import { BarChart3Icon, LayoutDashboardIcon, UsersIcon, WalletIcon, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import { Suspense } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

interface NavItem {
  href: "/dashboard" | "/employees" | "/insights";
  segment: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", segment: "dashboard", label: "Dashboard", icon: LayoutDashboardIcon },
  { href: "/employees", segment: "employees", label: "Employees", icon: UsersIcon },
  { href: "/insights", segment: "insights", label: "Insights", icon: BarChart3Icon },
];

function SidebarNav({ activeSegment }: { activeSegment: string | null }) {
  return (
    <SidebarMenu>
      {NAV_ITEMS.map((item) => {
        const active = activeSegment === item.segment;
        return (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
              <Link href={item.href} aria-current={active ? "page" : undefined}>
                <item.icon />
                <span>{item.label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}

/** The active segment is request data on dynamic routes, so it streams in; the links themselves are static. */
function ActiveSidebarNav() {
  return <SidebarNav activeSegment={useSelectedLayoutSegment()} />;
}

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <WalletIcon className="size-4" />
                </span>
                <span className="flex flex-col leading-tight">
                  <span className="font-semibold">ACME</span>
                  <span className="text-xs text-muted-foreground">Salary Management</span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <Suspense fallback={<SidebarNav activeSegment={null} />}>
              <ActiveSidebarNav />
            </Suspense>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
