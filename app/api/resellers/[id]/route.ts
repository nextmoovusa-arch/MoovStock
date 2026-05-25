import { NextResponse } from "next/server";
import { z } from "zod";
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
