import { NextRequest, NextResponse } from "next/server";
import { db, catalogItems } from "@/lib/db";
import { eq, asc } from "drizzle-orm";
import { getDefaultOrg } from "@/lib/default-org";

export async function GET(req: NextRequest) {
  const org = await getDefaultOrg();
  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get("categoryId");

  const items = categoryId
    ? await db.select().from(catalogItems).where(eq(catalogItems.categoryId, categoryId)).orderBy(asc(catalogItems.createdAt))
    : await db.select().from(catalogItems).where(eq(catalogItems.orgId, org.id)).orderBy(asc(catalogItems.createdAt));

  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const org = await getDefaultOrg();
  const body = await req.json() as {
    categoryId: string;
    name: string;
    description?: string;
    imageUrl?: string;
    imageData?: string;
  };

  if (!body.name?.trim()) return NextResponse.json({ error: "Tên không được để trống" }, { status: 400 });
  if (!body.categoryId) return NextResponse.json({ error: "Thiếu danh mục" }, { status: 400 });

  const [item] = await db.insert(catalogItems).values({
    orgId: org.id,
    categoryId: body.categoryId,
    name: body.name.trim(),
    description: body.description?.trim() ?? null,
    imageUrl: body.imageUrl?.trim() ?? null,
    imageData: body.imageData ?? null,
  }).returning();

  return NextResponse.json(item, { status: 201 });
}
