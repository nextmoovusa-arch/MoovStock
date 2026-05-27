import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { computeProfit } from "@/lib/profit";

const CreateSaleSchema = z.object({
  itemId: z.string().min(1),
  soldPrice: z.number().positive(),
  vintedFee: z.number().min(0).optional().default(0),
  pouchCost: z.number().min(0).optional().default(0),
  labelCost: z.number().min(0).optional().default(0),
  otherCost: z.number().min(0).optional().default(0),
  shippingFee: z.number().min(0).optional().default(0),
  buyerCountry: z.string().max(2).optional().nullable(),
  soldAt: z.string().datetime().optional(),
  notes: z.string().max(2000).optional().nullable(),
});

export async function POST(req: Request) {
  const user = await requireUser();
  const json = await req.json().catch(() => null);
  const parsed = CreateSaleSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides", issues: parsed.error.issues }, { status: 400 });
  }
  const d = parsed.data;

  const item = await prisma.item.findUnique({ where: { id: d.itemId }, include: { user: true } });
  if (!item) return NextResponse.json({ error: "Article introuvable" }, { status: 404 });
  if (user.role !== "ADMIN" && item.userId !== user.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  if (item.status === "SOLD") {
    return NextResponse.json({ error: "Article déjà vendu" }, { status: 409 });
  }

  // Si le client n'a pas fourni de coût pochette/étiquette, on dérive depuis
  // le stock du revendeur (Supply.unitCost du premier actif).
  if (!d.pouchCost || d.pouchCost === 0) {
    const s = await prisma.supply.findFirst({
      where: { userId: item.userId, type: "POUCH", active: true },
      orderBy: { createdAt: "asc" },
    });
    d.pouchCost = s?.unitCost ?? 0;
  }
  if (!d.labelCost || d.labelCost === 0) {
    const s = await prisma.supply.findFirst({
      where: { userId: item.userId, type: "LABEL_ROLL", active: true },
      orderBy: { createdAt: "asc" },
    });
    d.labelCost = s?.unitCost ?? 0;
  }

  const profit = computeProfit(item, d, item.user.commissionRate);

  const sale = await prisma.$transaction(async (tx) => {
    const created = await tx.sale.create({
      data: {
        itemId: item.id,
        resellerId: item.userId,
        soldPrice: d.soldPrice,
        vintedFee: d.vintedFee ?? 0,
        pouchCost: d.pouchCost ?? 0,
        labelCost: d.labelCost ?? 0,
        otherCost: d.otherCost ?? 0,
        shippingFee: d.shippingFee ?? 0,
        buyerCountry: d.buyerCountry || null,
        soldAt: d.soldAt ? new Date(d.soldAt) : new Date(),
        notes: d.notes || null,
        grossProfit: profit.grossProfit,
        resellerPayout: profit.resellerPayout,
        netProfit: profit.netProfit,
      },
    });
    await tx.item.update({
      where: { id: item.id },
      data: { status: "SOLD", soldAt: created.soldAt },
    });
    return created;
  });

  return NextResponse.json({ sale, profit });
}
