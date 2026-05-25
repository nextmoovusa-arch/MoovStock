import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { checkSupplyLevels } from "@/lib/alerts";

const PatchSchema = z.object({
  name: z.string().max(80).nullable().optional(),
  unitCost: z.number().min(0).optional(),
  restockThreshold: z.number().int().min(0).nullable().optional(),
  restockLeadDays: z.number().int().min(0).max(60).optional(),
  safetyMarginDays: z.number().int().min(0).max(60).optional(),
  active: z.boolean().optional(),
});

async function loadOwned(id: string, userId: string, isAdmin: boolean) {
  const supply = await prisma.supply.findUnique({ where: { id } });
  if (!supply) return null;
  if (!isAdmin && supply.userId !== userId) return null;
  return supply;
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await ctx.params;
  const supply = await loadOwned(id, user.id, user.role === "ADMIN");
  if (!supply) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const json = await req.json().catch(() => null);
  const parsed = PatchSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 });

  const updated = await prisma.supply.update({ where: { id }, data: parsed.data });
  const owner = await prisma.user.findUnique({ where: { id: supply.userId }, select: { id: true, name: true, email: true } });
  if (owner) await checkSupplyLevels(owner);
  return NextResponse.json({ supply: updated });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await ctx.params;
  const supply = await loadOwned(id, user.id, user.role === "ADMIN");
  if (!supply) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  await prisma.supply.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
