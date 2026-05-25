import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import {
  checkGoalForLog,
  checkInactivity,
  checkStockMismatch,
  checkSupplyLevels,
} from "@/lib/alerts";
import { applyDailyLogConsumption } from "@/lib/supplies";

const UpsertSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  itemsListed: z.number().int().min(0),
  itemsSold: z.number().int().min(0),
  pouchesUsed: z.number().int().min(0),
  labelsUsed: z.number().int().min(0),
  issues: z.string().max(2000).optional().nullable(),
});

function parseDay(yyyy_mm_dd: string): Date {
  const [y, m, d] = yyyy_mm_dd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export async function POST(req: Request) {
  const user = await requireUser();
  const json = await req.json().catch(() => null);
  const parsed = UpsertSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides", issues: parsed.error.issues }, { status: 400 });
  }
  const d = parsed.data;
  const date = parseDay(d.date);

  // Récupère l'ancien log pour calculer le delta de consommation
  const previous = await prisma.dailyLog.findUnique({
    where: { userId_date: { userId: user.id, date } },
  });

  const log = await prisma.dailyLog.upsert({
    where: { userId_date: { userId: user.id, date } },
    create: {
      userId: user.id,
      date,
      itemsListed: d.itemsListed,
      itemsSold: d.itemsSold,
      pouchesUsed: d.pouchesUsed,
      labelsUsed: d.labelsUsed,
      issues: d.issues || null,
    },
    update: {
      itemsListed: d.itemsListed,
      itemsSold: d.itemsSold,
      pouchesUsed: d.pouchesUsed,
      labelsUsed: d.labelsUsed,
      issues: d.issues || null,
    },
  });

  // Décrémentation auto des consommables
  await applyDailyLogConsumption({
    userId: user.id,
    dailyLogId: log.id,
    pouchesUsed: d.pouchesUsed,
    labelsUsed: d.labelsUsed,
    prevPouches: previous?.pouchesUsed ?? 0,
    prevLabels: previous?.labelsUsed ?? 0,
  });

  // Recalcul des alertes liées
  await Promise.all([
    checkInactivity(user),
    checkGoalForLog(user, { itemsListed: d.itemsListed, date }),
    checkStockMismatch(user),
    checkSupplyLevels(user),
  ]);

  return NextResponse.json({ log });
}

export async function GET() {
  const user = await requireUser();
  const since = new Date(Date.now() - 30 * 86400000);
  const logs = await prisma.dailyLog.findMany({
    where: { userId: user.id, date: { gte: since } },
    orderBy: { date: "desc" },
  });
  return NextResponse.json({ logs });
}
