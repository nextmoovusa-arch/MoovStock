import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { runAlertScan } from "@/lib/alerts";

export async function POST() {
  await requireAdmin();
  const res = await runAlertScan();
  return NextResponse.json(res);
}
