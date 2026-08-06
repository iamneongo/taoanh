import { Skeleton } from "@/components/ui/skeleton";

export default function ProjectsLoading() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-10">
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-2">
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-8 w-28 rounded-lg" />
        </div>
        <div className="space-y-2">
          {[0, 1, 2, 3, 4].map(i => <Skeleton key={i} className="h-[68px] rounded-xl" />)}
        </div>
      </div>
    </div>
  );
}
