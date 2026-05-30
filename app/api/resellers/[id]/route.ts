import { NextResponse } from "next/server";
import { z } from "zod";
import { clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

const PatchSchema = z.object({
  name: z.string().max(120).nullable().optional(),
  dailyGoalItems: z.number().int().min(0).max(1000).optional(),
  commissionRate: z.number().min(0).max(1).optional(),
  active: z.boolean().optional(),
  role: z.enum(["ADMIN", "RESELLER"]).optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await ctx.params;
  const json = await req.json().catch(() => null);
  const parsed = PatchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides", issues: parsed.error.issues }, { status: 400 });
  }
  const updated = await prisma.user.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ user: updated });
}

/**
 * Supprimer un revendeur et son accès.
 * - Si pas de ventes : hard delete (cascade items/supplies/dailyLogs/alerts).
 * - Si ventes existantes (FK Restrict côté Sale → User) : soft delete
 *   active=false + clerkId=null pour révoquer l'accès.
 * - Dans tous les cas, supprime aussi le compte Clerk si présent.
 */
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const { id } = await ctx.params;

  if (id === admin.id) {
    return NextResponse.json({ error: "Impossible de te supprimer toi-même." }, { status: 400 });
  }

  const target = await prisma.user.findUnique({
    where: { id },
    include: { _count: { select: { sales: true } } },
  });
  if (!target) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  if (target.role === "ADMIN") {
    return NextResponse.json({ error: "On ne supprime pas un autre admin via cette voie." }, { status: 400 });
  }

  // Révoquer l'accès Clerk si lié
  if (target.clerkId) {
    try {
      const client = await clerkClient();
      await client.users.deleteUser(target.clerkId);
    } catch {
      // ignore : on continue côté BDD
    }
  }

  if (target._count.sales === 0) {
    // Hard delete (cascade) — sécurisé car onDelete Cascade est en place sur
    // Item/Supply/DailyLog/Alert.
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ ok: true, hardDeleted: true });
  }

  // Soft delete : on garde l'historique des ventes
  await prisma.user.update({
    where: { id },
    data: { active: false, clerkId: null },
  });
  return NextResponse.json({ ok: true, softDeleted: true });
}
