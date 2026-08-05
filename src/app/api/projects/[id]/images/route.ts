import { NextRequest, NextResponse } from "next/server";
import { db, projectImages, projects } from "@/lib/db";
import { eq, and, desc } from "drizzle-orm";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const images = await db
    .select()
    .from(projectImages)
    .where(and(eq(projectImages.projectId, id), eq(projectImages.type, "generated")))
    .orderBy(desc(projectImages.createdAt));
  return NextResponse.json(images);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [project] = await db.select().from(projects).where(eq(projects.id, id));
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json() as { url?: string; b64Json?: string; prompt?: string; style?: string; type?: string };

  const [image] = await db
    .insert(projectImages)
    .values({
      projectId: id,
      type: body.type === "room_original" ? "room_original" : "generated",
      url: body.url ?? null,
      b64Json: body.b64Json ?? null,
      prompt: body.prompt ?? null,
      style: body.style ?? null,
      taskStatus: "success",
    })
    .returning();

  return NextResponse.json(image, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { imageId } = await req.json() as { imageId: string };
  await db.delete(projectImages).where(and(eq(projectImages.id, imageId), eq(projectImages.projectId, id)));
  return NextResponse.json({ ok: true });
}
