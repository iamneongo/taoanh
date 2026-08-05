import { NextRequest, NextResponse } from "next/server";
import { db, itemCategories } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { name, description } = await req.json() as { name: string; description?: string };
  const [updated] = await db.update(itemCategories)
    .set({ name: name.trim(), description: description?.trim() ?? null })
    .where(eq(itemCategories.id, id))
    .returning();
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.delete(itemCategories).where(eq(itemCategories.id, id));
  return NextResponse.json({ ok: true });
}
