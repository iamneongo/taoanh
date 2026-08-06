import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-10">
        <Skeleton className="h-8 w-40 mb-8" />
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-8">
          {[0, 1, 2].map(i => <Skeleton key={i} className="h-[74px] rounded-xl" />)}
        </div>
        <div className="grid grid-cols-2 gap-3 mb-8">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
        <Skeleton className="h-4 w-32 mb-3" />
        <div className="space-y-2">
          {[0, 1, 2].map(i => <Skeleton key={i} className="h-[62px] rounded-xl" />)}
        </div>
      </div>
    </div>
  );
}
