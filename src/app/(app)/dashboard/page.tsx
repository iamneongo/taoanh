import Link from "next/link";
import { db, projects } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { getDefaultOrg } from "@/lib/default-org";
import { Button } from "@/components/ui/button";
import { Plus, FolderOpen, Sparkles } from "lucide-react";
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

export default async function DashboardPage() {
  const org = await getDefaultOrg();
  const projectList = await db.select().from(projects)
    .where(eq(projects.orgId, org.id))
    .orderBy(desc(projects.updatedAt));

  const inProgress = projectList.filter(p => p.status === "in_progress").length;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-8 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-stone-900">Tổng quan</h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Tổng dự án",     value: projectList.length },
            { label: "Đang thực hiện", value: inProgress },
            { label: "Hoàn thành",     value: projectList.filter(p => p.status === "completed").length },
          ].map(({ label, value }) => (
            <Link key={label} href="/projects"
              className="rounded-xl border border-stone-100 bg-stone-50 px-5 py-4 hover:bg-stone-100 transition-colors">
              <p className="text-2xl font-bold text-stone-900">{value}</p>
              <p className="text-xs text-stone-500 mt-0.5">{label}</p>
            </Link>
          ))}
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <Link href="/projects/new"
            className="rounded-xl border border-stone-900 bg-stone-900 p-5 hover:bg-stone-800 transition-colors">
            <Plus className="size-5 text-stone-300 mb-3" />
            <p className="font-medium text-sm text-white mb-1">Tạo dự án mới</p>
            <p className="text-xs text-stone-400">Bắt đầu dự án cho khách hàng</p>
          </Link>
          <Link href="/catalog"
            className="rounded-xl border border-stone-100 bg-stone-50 p-5 hover:bg-stone-100 transition-colors">
            <FolderOpen className="size-5 text-stone-500 mb-3" />
            <p className="font-medium text-sm text-stone-900 mb-1">Danh mục sản phẩm</p>
            <p className="text-xs text-stone-400">Quản lý nội thất của công ty</p>
          </Link>
        </div>

        {/* Recent projects */}
        {projectList.length === 0 ? (
          <div className="rounded-xl border border-dashed border-stone-200 p-12 text-center">
            <Sparkles className="size-8 text-stone-300 mx-auto mb-4" />
            <h3 className="font-medium text-stone-600 mb-2">Chưa có dự án nào</h3>
            <p className="text-sm text-stone-400 mb-6 max-w-xs mx-auto">
              Tạo dự án đầu tiên để bắt đầu visualize không gian nội thất
            </p>
            <Button asChild size="sm">
              <Link href="/projects/new"><Plus className="size-4" /> Tạo dự án đầu tiên</Link>
            </Button>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-stone-400">Dự án gần đây</p>
              <Link href="/projects" className="text-xs text-stone-500 hover:text-stone-800">Xem tất cả →</Link>
            </div>
            <div className="space-y-2">
              {projectList.slice(0, 5).map(project => (
                <Link key={project.id} href={`/projects/${project.id}`}
                  className="flex items-center gap-4 rounded-xl border border-stone-100 bg-white px-5 py-3.5 hover:border-stone-200 hover:bg-stone-50 transition-colors">
                  <div className="size-8 rounded-lg bg-stone-100 flex items-center justify-center flex-shrink-0">
                    <FolderOpen className="size-3.5 text-stone-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-900 truncate">{project.clientName}</p>
                    <p className="text-xs text-stone-400 truncate mt-0.5">
                      {project.clientEmail ?? project.roomDescription ?? "—"}
                    </p>
                  </div>
                  <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-medium flex-shrink-0", statusColor[project.status])}>
                    {statusLabel[project.status]}
                  </span>
                  <span className="text-xs text-stone-300 flex-shrink-0">
                    {new Date(project.updatedAt).toLocaleDateString("vi-VN")}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
