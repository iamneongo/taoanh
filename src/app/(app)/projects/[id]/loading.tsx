import { Skeleton } from "@/components/ui/skeleton";

export default function ProjectLoading() {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 md:gap-4 border-b border-stone-100 px-3 md:px-5 py-3 flex-shrink-0">
        <Skeleton className="size-5 rounded-md" />
        <Skeleton className="h-4 w-44" />
        <div className="ml-auto flex items-center gap-1.5">
          {[0, 1, 2, 3, 4].map(i => <Skeleton key={i} className="size-5 rounded-full" />)}
        </div>
      </div>
      {/* Two-panel body */}
      <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden">
        <aside className="w-full md:w-64 flex-shrink-0 border-b md:border-b-0 md:border-r border-stone-100 bg-stone-50/40 p-4 space-y-3">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-4 w-24" />
          <div className="flex flex-wrap gap-1.5">
            {[0, 1, 2, 3, 4].map(i => <Skeleton key={i} className="h-7 w-20 rounded-lg" />)}
          </div>
        </aside>
        <div className="flex-1 p-4 md:p-5 space-y-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="w-full rounded-2xl aspect-[4/3] max-h-[60vh]" />
        </div>
      </div>
    </div>
  );
}
