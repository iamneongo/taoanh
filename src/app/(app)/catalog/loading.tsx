import { Skeleton } from "@/components/ui/skeleton";

export default function CatalogLoading() {
  return (
    <div className="flex flex-col md:flex-row h-full min-h-0">
      <aside className="w-full md:w-56 flex-shrink-0 border-b md:border-b-0 md:border-r border-stone-100 bg-stone-50/40 p-3 space-y-2">
        <Skeleton className="h-4 w-20 mb-2" />
        {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-9 rounded-md" />)}
      </aside>
      <div className="flex-1 overflow-y-auto">
        <div className="flex items-center justify-between px-4 md:px-8 py-4 md:py-5 border-b border-stone-100">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-8 w-32 rounded-lg" />
        </div>
        <div className="px-4 md:px-8 py-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
              <Skeleton key={i} className="aspect-square rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
