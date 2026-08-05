import { NextResponse } from "next/server";
import { db, projects } from "@/lib/db";
import { getDefaultOrg } from "@/lib/default-org";

export async function POST(req: Request) {
  const body = await req.json() as { clientName: string; clientEmail?: string; roomDescription?: string };
  const { clientName, clientEmail, roomDescription } = body;

  if (!clientName?.trim()) {
    return NextResponse.json({ error: "Tên khách hàng không được để trống" }, { status: 400 });
  }

  const org = await getDefaultOrg();

  const [project] = await db.insert(projects).values({
    orgId: org.id,
    clientName: clientName.trim(),
    clientEmail: clientEmail?.trim() ?? null,
    roomDescription: roomDescription?.trim() ?? null,
    status: "draft",
    currentStep: 1,
  }).returning();

  return NextResponse.json({ id: project.id });
}
