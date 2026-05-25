import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { checkSupplyLevels } from "@/lib/alerts";

const CreateSchema = z.object({
  type: z.enum(["POUCH", "LABEL_ROLL", "PRINTER_INK", "OTHER"]),
  name: z.string().max(80).optional().nullable(),
  quantity: z.number().int().min(0).default(0),
  unitCost: z.number().min(0).default(0),
  restockThreshold: z.number().int().min(0).nullable().optional(),
  restockLeadDays: z.number().int().min(0).max(60).default(3),
  safetyMarginDays: z.number().int().min(0).max(60).default(2),
});

export async function POST(req: Request) {
  const user = await requireUser();
  const json = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides", issues: parsed.error.issues }, { status: 400 });
  }
  const d = parsed.data;

  const supply = await prisma.supply.create({
    data: {
      userId: user.id,
      type: d.type,
      name: d.name || null,
      quantity: d.quantity,
      unitCost: d.unitCost,
      restockThreshold: d.restockThreshold ?? null,
      restockLeadDays: d.restockLeadDays,
      safetyMarginDays: d.safetyMarginDays,
      lastRestockedAt: d.quantity > 0 ? new Date() : null,
    },
  });

  // Mouvement initial si quantité > 0
  if (d.quantity > 0) {
    await prisma.supplyMovement.create({
      data: {
        supplyId: supply.id,
        delta: d.quantity,
        reason: "RESTOCK",
        note: "Stock initial",
      },
    });
  }

  await checkSupplyLevels(user);
  return NextResponse.json({ supply });
}
