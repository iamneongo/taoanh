"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { FolderOpen, Package, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { LayoutDashboard } from "@/components/animate-ui/icons/layout-dashboard";
import { Settings } from "@/components/animate-ui/icons/settings";
import { AnimateIcon } from "@/components/animate-ui/icons/icon";
import { Logo } from "@/components/logo";
import {
  Highlight, HighlightItem,
} from "@/components/animate-ui/primitives/effects/highlight";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Tổng quan" },
  { href: "/projects",  icon: FolderOpen,      label: "Dự án" },
  { href: "/catalog",   icon: Package,          label: "Danh mục" },
  { href: "/settings",  icon: Settings,         label: "Cài đặt" },
];

function activeHref(pathname: string) {
  const match = navItems.find(
    (n) => pathname === n.href || (n.href !== "/dashboard" && pathname.startsWith(n.href)),
  );
  return match?.href ?? "/dashboard";
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const current = activeHref(pathname);

  // Auto-collapse the sidebar to an icon rail on small screens.
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const apply = () => setCollapsed(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <motion.aside
        animate={{ width: collapsed ? 56 : 224 }}
        transition={{ type: "spring", stiffness: 400, damping: 38 }}
        className="flex-shrink-0 border-r border-stone-100 flex flex-col bg-stone-50/60 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-3 border-b border-stone-100 min-h-[52px]">
          {!collapsed && (
            <div className="flex items-center gap-2 min-w-0">
              <Logo className="h-5 w-auto text-stone-900 flex-shrink-0" />
              <span className="text-sm font-semibold text-stone-900 truncate">GP Interior AI</span>
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
              <Logo className="h-4 w-auto text-white" />
            </div>
          </div>
        )}

        {/* Nav with sliding highlight */}
        <Highlight
          mode="parent"
          controlledItems
          forceUpdateBounds
          value={current}
          className="rounded-md bg-stone-200/70"
          transition={{ type: "spring", stiffness: 350, damping: 35 }}
          containerClassName="flex-1 px-2 py-3 space-y-0.5"
        >
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = current === href;
            return (
              <HighlightItem key={href} value={href}>
                <Link
                  href={href}
                  title={collapsed ? label : undefined}
                  className={cn(
                    "block rounded-md text-sm transition-colors",
                    active
                      ? "text-stone-900 font-medium"
                      : "text-stone-600 hover:text-stone-900",
                  )}
                >
                  <AnimateIcon animateOnHover>
                    <span className={cn(
                      "flex items-center",
                      collapsed ? "justify-center px-2 py-2.5" : "gap-2.5 px-3 py-2",
                    )}>
                      <Icon className="size-4 flex-shrink-0" />
                      {!collapsed && <span className="truncate">{label}</span>}
                    </span>
                  </AnimateIcon>
                </Link>
              </HighlightItem>
            );
          })}
        </Highlight>
      </motion.aside>

      <main className="flex-1 min-w-0 overflow-hidden flex flex-col">
        {children}
      </main>
    </div>
  );
}
