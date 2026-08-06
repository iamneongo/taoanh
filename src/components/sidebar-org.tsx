"use client";

import { Sofa } from "lucide-react";

export function SidebarOrg() {
  return (
    <div className="flex items-center gap-2 px-2 py-1.5">
      <div className="size-6 rounded-md bg-stone-900 flex items-center justify-center flex-shrink-0">
        <Sofa className="size-3.5 text-white" />
      </div>
      <span className="text-xs font-semibold text-stone-700 truncate">GP Interior AI</span>
    </div>
  );
}

export function SidebarUser() {
  return null;
}
