import { NextResponse } from "next/server";
import { consolidateOrgs } from "@/lib/default-org";

export async function POST() {
  await consolidateOrgs();
  return NextResponse.json({ ok: true });
}
