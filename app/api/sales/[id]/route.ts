import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { computeProfit } from "@/lib/profit";

const PatchSchema = z.object({
  soldPrice: z.number().positive().optional(),
  vintedFee: z.number().min(0).optional(),
  pouchCost: z.number().min(0).optional(),
  labelCost: z.number().min(0).optional(),
  otherCost: z.number().min(0).optional(),
  buyerCountry: z.string().max(2).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
});

async function loadSale(id: string, userId: string, isAdmin: boolean) {
  const sale = await prisma.sale.findUnique({
    where: { id },
    include: { item: true, reseller: true },
  });
  if (!sale) return null;
  if (!isAdmin && sale.resellerId !== userId) return null;
  return sale;
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await ctx.params;
  const sale = await loadSale(id, user.id, user.role === "ADMIN");
  if (!sale) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const json = await req.json().catch(() => null);
  const parsed = PatchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }
  const d = parsed.data;

  const merged = {
    soldPrice: d.soldPrice ?? sale.soldPrice,
    vintedFee: d.vintedFee ?? sale.vintedFee,
    pouchCost: d.pouchCost ?? sale.pouchCost,
    labelCost: d.labelCost ?? sale.labelCost,
    otherCost: d.otherCost ?? sale.otherCost,
    shippingFee: sale.shippingFee,
  };

  const profit = computeProfit(sale.item, merged, sale.reseller.commissionRate);

  const updated = await prisma.sale.update({
    where: { id },
    data: {
      ...d,
      grossProfit: profit.grossProfit,
      resellerPayout: profit.resellerPayout,
      netProfit: profit.netProfit,
    },
  });

  return NextResponse.json({ sale: updated });
}

/**
 * Supprime une vente :
 * - L'article repasse en LISTED (était sold)
 * - Si une transaction de payout existait, on la supprime aussi
 * - Restaure 1 pochette / 1 étiquette si des supplies existaient
 */
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await ctx.params;
  const sale = await loadSale(id, user.id, user.role === "ADMIN");
  if (!sale) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  await prisma.$transaction(async (tx) => {
    // Restore item to LISTED
    await tx.item.update({
      where: { id: sale.itemId },
      data: { status: "LISTED", soldAt: null },
    });

    // Restore supplies (best effort : +1 sur le premier supply actif du type)
    if (sale.pouchCost > 0) {
      const pouch = await tx.supply.findFirst({
        where: { userId: sale.resellerId, type: "POUCH", active: true },
      });
      if (pouch) {
        await tx.supply.update({ where: { id: pouch.id }, data: { quantity: pouch.quantity + 1 } });
      }
    }
    if (sale.labelCost > 0) {
      const label = await tx.supply.findFirst({
        where: { userId: sale.resellerId, type: "LABEL_ROLL", active: true },
      });
      if (label) {
        await tx.supply.update({ where: { id: label.id }, data: { quantity: label.quantity + 1 } });
      }
    }

    // Supprime le payout lié (cascade rétablira l'état pending)
    await tx.transaction.deleteMany({ where: { relatedSaleId: id } });

    // Delete the sale
    await tx.sale.delete({ where: { id } });
  });

  return NextResponse.json({ ok: true });
}
