import { db, projects } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { getDefaultOrg } from "@/lib/default-org";
import { DashboardView } from "./dashboard-view";

export default async function DashboardPage() {
  const org = await getDefaultOrg();
  const projectList = await db.select().from(projects)
    .where(eq(projects.orgId, org.id))
    .orderBy(desc(projects.updatedAt));

  const inProgress = projectList.filter(p => p.status === "in_progress").length;
  const completed = projectList.filter(p => p.status === "completed").length;

  const recent = projectList.slice(0, 5).map(p => ({
    id: p.id,
    clientName: p.clientName,
    subtitle: p.clientEmail ?? p.roomDescription ?? "—",
    status: p.status,
    date: new Date(p.updatedAt).toLocaleDateString("vi-VN"),
  }));

  return (
    <DashboardView
      projects={recent}
      total={projectList.length}
      inProgress={inProgress}
      completed={completed}
    />
  );
}
