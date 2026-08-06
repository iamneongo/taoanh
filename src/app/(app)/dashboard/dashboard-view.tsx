"use client";

import Link from "next/link";
import { FolderOpen, Sparkles } from "lucide-react";
import { Plus } from "@/components/animate-ui/icons/plus";
import { ArrowRight } from "@/components/animate-ui/icons/arrow-right";
import { AnimateIcon } from "@/components/animate-ui/icons/icon";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CountingNumber } from "@/components/animate-ui/primitives/texts/counting-number";
import { FadeIn, StaggerGroup, StaggerItem } from "@/components/ui/motion-primitives";

type DashProject = {
  id: string;
  clientName: string;
  subtitle: string;
  status: string;
  date: string;
};

const statusLabel: Record<string, string> = {
  draft: "Nháp",
  in_progress: "Đang thực hiện",
  completed: "Hoàn thành",
};
const statusVariant: Record<string, "secondary" | "warning" | "success"> = {
  draft: "secondary",
  in_progress: "warning",
  completed: "success",
};

export function DashboardView({
  projects,
  total,
  inProgress,
  completed,
}: {
  projects: DashProject[];
  total: number;
  inProgress: number;
  completed: number;
}) {
  const stats = [
    { label: "Tổng dự án", value: total },
    { label: "Đang thực hiện", value: inProgress },
    { label: "Hoàn thành", value: completed },
  ];

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-10">
        <FadeIn className="mb-8">
          <h1 className="text-2xl font-bold text-stone-900">Tổng quan</h1>
        </FadeIn>

        {/* Stats */}
        <StaggerGroup className="grid grid-cols-3 sm:grid-cols-3 gap-3 sm:gap-4 mb-8">
          {stats.map(({ label, value }) => (
            <StaggerItem key={label}>
              <Link href="/projects">
                <Card className="gap-0 px-5 py-4 transition-colors hover:bg-stone-50">
                  <p className="text-3xl font-bold text-stone-900 tabular-nums">
                    <CountingNumber number={value} transition={{ stiffness: 120, damping: 30 }} />
                  </p>
                  <p className="text-xs text-stone-500 mt-1">{label}</p>
                </Card>
              </Link>
            </StaggerItem>
          ))}
        </StaggerGroup>

        {/* Quick actions */}
        <StaggerGroup className="grid grid-cols-2 gap-3 mb-8">
          <StaggerItem>
            <Link href="/projects/new" className="block h-full">
              <AnimateIcon animateOnHover asChild>
                <Card className="h-full gap-0 border-stone-900 bg-stone-900 p-5 transition-colors hover:bg-stone-800">
                  <Plus className="size-5 text-stone-300 mb-3" />
                  <p className="font-medium text-sm text-white mb-1">Tạo dự án mới</p>
                  <p className="text-xs text-stone-400">Bắt đầu dự án cho khách hàng</p>
                </Card>
              </AnimateIcon>
            </Link>
          </StaggerItem>
          <StaggerItem>
            <Link href="/catalog" className="block h-full">
              <Card className="h-full gap-0 p-5 transition-colors hover:bg-stone-50">
                <FolderOpen className="size-5 text-stone-500 mb-3" />
                <p className="font-medium text-sm text-stone-900 mb-1">Danh mục sản phẩm</p>
                <p className="text-xs text-stone-400">Quản lý nội thất của công ty</p>
              </Card>
            </Link>
          </StaggerItem>
        </StaggerGroup>

        {/* Recent projects */}
        {projects.length === 0 ? (
          <FadeIn delay={0.1}>
            <Card className="items-center border-dashed p-12 text-center">
              <Sparkles className="size-8 text-stone-300 mb-4" />
              <h3 className="font-medium text-stone-600 mb-2">Chưa có dự án nào</h3>
              <p className="text-sm text-stone-400 mb-6 max-w-xs mx-auto">
                Tạo dự án đầu tiên để bắt đầu visualize không gian nội thất
              </p>
              <Button asChild size="sm">
                <Link href="/projects/new"><Plus className="size-4" animateOnHover /> Tạo dự án đầu tiên</Link>
              </Button>
            </Card>
          </FadeIn>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-stone-400">Dự án gần đây</p>
              <AnimateIcon animateOnHover asChild>
                <Link href="/projects" className="text-xs text-stone-500 hover:text-stone-800 inline-flex items-center gap-1">
                  Xem tất cả <ArrowRight className="size-3" />
                </Link>
              </AnimateIcon>
            </div>
            <StaggerGroup className="space-y-2">
              {projects.map(project => (
                <StaggerItem key={project.id}>
                  <Link href={`/projects/${project.id}`}
                    className="flex items-center gap-4 rounded-xl border border-stone-100 bg-white px-5 py-3.5 hover:border-stone-200 hover:bg-stone-50 transition-colors">
                    <div className="size-8 rounded-lg bg-stone-100 flex items-center justify-center flex-shrink-0">
                      <FolderOpen className="size-3.5 text-stone-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-900 truncate">{project.clientName}</p>
                      <p className="text-xs text-stone-400 truncate mt-0.5">{project.subtitle}</p>
                    </div>
                    <Badge variant={statusVariant[project.status]} className="flex-shrink-0">
                      {statusLabel[project.status]}
                    </Badge>
                    <span className="text-xs text-stone-300 flex-shrink-0">{project.date}</span>
                  </Link>
                </StaggerItem>
              ))}
            </StaggerGroup>
          </div>
        )}
      </div>
    </div>
  );
}
