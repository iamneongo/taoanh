import { redirect } from "next/navigation";
import { db, projects, projectImages } from "@/lib/db";
import { eq, and, desc } from "drizzle-orm";
import { ProjectWorkflow } from "./project-workflow";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [project] = await db.select().from(projects).where(eq(projects.id, id));
  if (!project) redirect("/projects");

  const [savedImages, sourceImages] = await Promise.all([
    db.select().from(projectImages)
      .where(and(eq(projectImages.projectId, id), eq(projectImages.type, "generated")))
      .orderBy(desc(projectImages.createdAt)),
    db.select().from(projectImages)
      .where(and(eq(projectImages.projectId, id), eq(projectImages.type, "room_original")))
      .orderBy(desc(projectImages.createdAt)),
  ]);

  return <ProjectWorkflow project={project} savedImages={savedImages} sourceImages={sourceImages} />;
}
