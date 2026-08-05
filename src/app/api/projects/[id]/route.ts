import { NextRequest, NextResponse } from "next/server";
import { db, projects } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const body = await req.json() as {
    clientName?: string;
    clientEmail?: string;
    roomDescription?: string;
    status?: string;
    currentStep?: number;
    settings?: Record<string, unknown>;
  };

  const [updated] = await db
    .update(projects)
    .set({
      ...(body.clientName      !== undefined && { clientName: body.clientName.trim() }),
      ...(body.clientEmail     !== undefined && { clientEmail: body.clientEmail.trim() || null }),
      ...(body.roomDescription !== undefined && { roomDescription: body.roomDescription.trim() || null }),
      ...(body.status          !== undefined && { status: body.status as "draft" | "in_progress" | "completed" }),
      ...(body.currentStep     !== undefined && { currentStep: body.currentStep }),
      ...(body.settings        !== undefined && { settings: body.settings }),
      updatedAt: new Date(),
    })
    .where(eq(projects.id, id))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.delete(projects).where(eq(projects.id, id));
  return NextResponse.json({ ok: true });
}
