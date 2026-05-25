import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { applyMovement } from "@/lib/supplies";
import { checkSupplyLevels } from "@/lib/alerts";

const MovementSchema = z.object({
  delta: z.number().int(),
  reason: z.enum(["RESTOCK", "CONSUMPTION", "MANUAL_ADJUST", "LOSS"]),
  note: z.string().max(500).optional().nullable(),
});

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await ctx.params;

  const supply = await prisma.supply.findUnique({ where: { id } });
  if (!supply) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  if (user.role !== "ADMIN" && supply.userId !== user.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const json = await req.json().catch(() => null);
  const parsed = MovementSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  if (parsed.data.delta === 0) {
    return NextResponse.json({ error: "Delta = 0" }, { status: 400 });
  }

  const updated = await applyMovement({
    supplyId: id,
    delta: parsed.data.delta,
    reason: parsed.data.reason,
    note: parsed.data.note ?? undefined,
  });

  const owner = await prisma.user.findUnique({ where: { id: supply.userId }, select: { id: true, name: true, email: true } });
  if (owner) await checkSupplyLevels(owner);
  return NextResponse.json({ supply: updated });
}
