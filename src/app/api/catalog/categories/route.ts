import { NextRequest, NextResponse } from "next/server";
import { db, itemCategories } from "@/lib/db";
import { eq, asc } from "drizzle-orm";
import { getDefaultOrg } from "@/lib/default-org";

export async function GET() {
  const org = await getDefaultOrg();
  const cats = await db.select().from(itemCategories)
    .where(eq(itemCategories.orgId, org.id))
    .orderBy(asc(itemCategories.sortOrder), asc(itemCategories.createdAt));
  return NextResponse.json(cats);
}

export async function POST(req: NextRequest) {
  const org = await getDefaultOrg();
  const { name, description } = await req.json() as { name: string; description?: string };
  if (!name?.trim()) return NextResponse.json({ error: "Tên không được để trống" }, { status: 400 });

  const [cat] = await db.insert(itemCategories).values({
    orgId: org.id,
    name: name.trim(),
    description: description?.trim() ?? null,
  }).returning();
  return NextResponse.json(cat, { status: 201 });
}
