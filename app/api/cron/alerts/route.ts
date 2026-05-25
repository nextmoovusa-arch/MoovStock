import { NextResponse } from "next/server";
import { runAlertScan } from "@/lib/alerts";

/**
 * Endpoint déclenché par Vercel Cron (cf. vercel.json).
 * Protégé par le header Authorization "Bearer <CRON_SECRET>".
 */
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const res = await runAlertScan();
  return NextResponse.json({ ok: true, ...res });
}
