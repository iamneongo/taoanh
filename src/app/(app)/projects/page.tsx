import Link from "next/link";
import { db, projects, projectImages } from "@/lib/db";
import { eq, desc, count } from "drizzle-orm";
import { getDefaultOrg } from "@/lib/default-org";
import { Button } from "@/components/ui/button";
import { ProjectActions } from "@/components/project-actions";
import { Plus, FolderOpen, ChevronRight, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const statusLabel: Record<string, string> = {
  draft: "Nháp",
  in_progress: "Đang thực hiện",
  completed: "Hoàn thành",
};
const statusColor: Record<string, string> = {
  draft: "bg-stone-100 text-stone-500",
  in_progress: "bg-amber-50 text-amber-600",
  completed: "bg-emerald-50 text-emerald-600",
};

export default async function ProjectsPage() {
  const org = await getDefaultOrg();

  const [projectList, imageCounts] = await Promise.all([
    db.select().from(projects).where(eq(projects.orgId, org.id)).orderBy(desc(projects.updatedAt)),
    db.select({ projectId: projectImages.projectId, cnt: count() })
      .from(projectImages)
      .where(eq(projectImages.type, "generated"))
      .groupBy(projectImages.projectId),
  ]);

  const imageCountMap = Object.fromEntries(imageCounts.map(r => [r.projectId, Number(r.cnt)]));

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-bold text-stone-900">Dự án</h1>
            <p className="text-sm text-stone-400 mt-0.5">Quản lý tất cả dự án</p>
          </div>
          <Button asChild size="sm">
            <Link href="/projects/new"><Plus className="size-4" /> Dự án mới</Link>
          </Button>
        </div>

        {projectList.length === 0 ? (
          <div className="rounded-xl border border-dashed border-stone-200 py-16 text-center">
            <FolderOpen className="size-8 text-stone-300 mx-auto mb-4" />
            <h3 className="font-medium text-stone-600 mb-2">Chưa có dự án</h3>
            <p className="text-sm text-stone-400 mb-6">Tạo dự án đầu tiên để bắt đầu</p>
            <Button asChild size="sm">
              <Link href="/projects/new"><Plus className="size-4" /> Tạo dự án</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {projectList.map(project => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="flex items-center gap-4 rounded-xl border border-stone-100 bg-white px-5 py-4 hover:border-stone-300 hover:bg-stone-50/60 transition-all group"
              >
                <div className="size-9 rounded-lg bg-stone-100 flex items-center justify-center flex-shrink-0">
                  <FolderOpen className="size-4 text-stone-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-900 truncate">{project.clientName}</p>
                  <p className="text-xs text-stone-400 mt-0.5 truncate">
                    {project.clientEmail ?? project.roomDescription ?? "Không có mô tả"}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {(imageCountMap[project.id] ?? 0) > 0 && (
                    <span className="flex items-center gap-1 text-xs text-stone-400">
                      <ImageIcon className="size-3" />
                      {imageCountMap[project.id]}
                    </span>
                  )}
                  <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-medium", statusColor[project.status])}>
                    {statusLabel[project.status]}
                  </span>
                  <span className="text-xs text-stone-300">
                    {new Date(project.updatedAt).toLocaleDateString("vi-VN")}
                  </span>
                  <ProjectActions project={project} />
                  <ChevronRight className="size-4 text-stone-300 group-hover:text-stone-500 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
