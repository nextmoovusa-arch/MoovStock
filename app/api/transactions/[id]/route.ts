import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await ctx.params;
  const tx = await prisma.transaction.findUnique({ where: { id } });
  if (!tx) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  // Si liée à une vente (payout), on remet la vente en PENDING
  await prisma.$transaction(async (t) => {
    await t.transaction.delete({ where: { id } });
    if (tx.relatedSaleId) {
      await t.sale.update({
        where: { id: tx.relatedSaleId },
        data: { paymentStatus: "PENDING", paidAt: null },
      });
    }
  });

  return NextResponse.json({ ok: true });
}
