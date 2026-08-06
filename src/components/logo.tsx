import { cn } from "@/lib/utils";

/** GP Interior AI pixel-grid mark. Uses currentColor so it recolors via text color. */
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-stone-900", className)}
      aria-hidden="true"
    >
      <rect y="37" width="7" height="7" fill="currentColor" />
      <rect opacity="0.6" x="7" y="37" width="7" height="7" fill="currentColor" />
      <rect opacity="0.32" x="14" y="37" width="7" height="7" fill="currentColor" />
      <rect opacity="0.07" x="21" y="37" width="7" height="7" fill="currentColor" />
      <rect opacity="0.6" y="30" width="7" height="7" fill="currentColor" />
      <rect opacity="0.32" x="7" y="30" width="7" height="7" fill="currentColor" />
      <rect opacity="0.07" x="7" y="23" width="7" height="7" fill="currentColor" />
      <rect opacity="0.07" x="14" y="30" width="7" height="7" fill="currentColor" />
      <rect opacity="0.32" y="23" width="7" height="7" fill="currentColor" />
      <rect opacity="0.07" y="16" width="7" height="7" fill="currentColor" />
      <rect x="33" y="4" width="7" height="7" fill="currentColor" />
      <rect opacity="0.6" x="33" y="11" width="7" height="7" fill="currentColor" />
      <rect opacity="0.32" x="26" y="11" width="7" height="7" fill="currentColor" />
      <rect opacity="0.07" x="19" y="11" width="7" height="7" fill="currentColor" />
      <rect opacity="0.32" x="33" y="18" width="7" height="7" fill="currentColor" />
      <rect opacity="0.07" x="26" y="18" width="7" height="7" fill="currentColor" />
      <rect opacity="0.07" x="33" y="25" width="7" height="7" fill="currentColor" />
      <rect opacity="0.6" x="26" y="4" width="7" height="7" fill="currentColor" />
      <rect opacity="0.32" x="19" y="4" width="7" height="7" fill="currentColor" />
      <rect opacity="0.07" x="12" y="4" width="7" height="7" fill="currentColor" />
    </svg>
  );
}
