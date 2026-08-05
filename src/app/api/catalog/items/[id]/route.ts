import { NextRequest, NextResponse } from "next/server";
import { db, catalogItems } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json() as { name?: string; description?: string; imageUrl?: string; imageData?: string; active?: boolean };

  const [updated] = await db.update(catalogItems).set({
    ...(body.name        !== undefined && { name: body.name.trim() }),
    ...(body.description !== undefined && { description: body.description.trim() || null }),
    ...(body.imageUrl    !== undefined && { imageUrl: body.imageUrl.trim() || null }),
    ...(body.imageData   !== undefined && { imageData: body.imageData || null }),
    ...(body.active      !== undefined && { active: body.active }),
  }).where(eq(catalogItems.id, id)).returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.delete(catalogItems).where(eq(catalogItems.id, id));
  return NextResponse.json({ ok: true });
}
