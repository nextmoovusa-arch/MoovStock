import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function PATCH(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await ctx.params;
  const updated = await prisma.alert.update({
    where: { id },
    data: { resolvedAt: new Date() },
  });
  return NextResponse.json({ alert: updated });
}
