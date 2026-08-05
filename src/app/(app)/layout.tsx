"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sofa, LayoutDashboard, FolderOpen, Settings, Package,
  PanelLeftClose, PanelLeftOpen,
} from "lucide-react";
import { SidebarOrg } from "@/components/sidebar-org";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Tổng quan" },
  { href: "/projects",  icon: FolderOpen,      label: "Dự án" },
  { href: "/catalog",   icon: Package,          label: "Danh mục" },
  { href: "/settings",  icon: Settings,         label: "Cài đặt" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <aside className={cn(
        "flex-shrink-0 border-r border-stone-100 flex flex-col bg-stone-50/60 transition-[width] duration-200",
        collapsed ? "w-14" : "w-56",
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-3 border-b border-stone-100 min-h-[52px]">
          {!collapsed && (
            <div className="flex items-center gap-2 min-w-0">
              <Sofa className="size-4 text-stone-700 flex-shrink-0" />
              <span className="text-sm font-semibold text-stone-900 truncate">VisioNT</span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(c => !c)}
            className={cn(
              "size-6 rounded-md flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors flex-shrink-0",
              collapsed && "mx-auto",
            )}
            title={collapsed ? "Mở rộng" : "Thu gọn"}
          >
            {collapsed ? <PanelLeftOpen className="size-3.5" /> : <PanelLeftClose className="size-3.5" />}
          </button>
        </div>

        {/* Brand (collapsed: icon only) */}
        {collapsed && (
          <div className="px-2 py-2.5 flex justify-center border-b border-stone-100">
            <div className="size-7 rounded-md bg-stone-900 flex items-center justify-center">
              <Sofa className="size-4 text-white" />
            </div>
          </div>
        )}
        {!collapsed && (
          <div className="border-b border-stone-100 px-3 py-2.5">
            <SidebarOrg />
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                title={collapsed ? label : undefined}
                className={cn(
                  "flex items-center rounded-md text-sm transition-colors",
                  collapsed ? "justify-center px-2 py-2.5" : "gap-2.5 px-3 py-2",
                  active
                    ? "bg-stone-100 text-stone-900 font-medium"
                    : "text-stone-600 hover:bg-stone-100 hover:text-stone-900",
                )}
              >
                <Icon className="size-4 flex-shrink-0" />
                {!collapsed && label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 min-w-0 overflow-hidden flex flex-col">
        {children}
      </main>
    </div>
  );
}
