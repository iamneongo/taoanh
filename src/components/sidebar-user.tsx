"use client";

import { useAuth, UserButton, OrganizationSwitcher } from "@clerk/nextjs";

export function SidebarOrg() {
  return (
    <OrganizationSwitcher
      hidePersonal
      afterCreateOrganizationUrl="/dashboard"
      afterSelectOrganizationUrl="/dashboard"
      appearance={{
        elements: {
          organizationSwitcherTrigger:
            "text-xs text-stone-600 hover:bg-stone-100 rounded px-2 py-1 w-full justify-start",
        },
      }}
    />
  );
}

export function SidebarUser() {
  return <UserButton appearance={{ elements: { avatarBox: "size-7" } }} />;
}
