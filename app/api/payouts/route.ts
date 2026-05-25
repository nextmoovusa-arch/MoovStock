import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

const Schema = z.object({
  resellerId: z.string().min(1),
  account: z.enum(["CASH", "BANK", "PAYPAL", "REVOLUT", "OTHER"]),
  note: z.string().max(500).optional().nullable(),
});

/**
 * Marque toutes les ventes PENDING d'un revendeur comme PAID_TO_RESELLER
 * et crée 1 Transaction RESELLER_PAYOUT par vente (traçabilité).
 */
export async function POST(req: Request) {
  await requireAdmin();
  const json = await req.json().catch(() => null);
  const parsed = Schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }
  const { resellerId, account, note } = parsed.data;

  const sales = await prisma.sale.findMany({
    where: { resellerId, paymentStatus: "PENDING", resellerPayout: { gt: 0 } },
  });
  if (sales.length === 0) {
    return NextResponse.json({ ok: true, count: 0, total: 0 });
  }

  const total = sales.reduce((s, x) => s + x.resellerPayout, 0);
  const paidAt = new Date();

  await prisma.$transaction(async (t) => {
    for (const sale of sales) {
      await t.transaction.create({
        data: {
          type: "RESELLER_PAYOUT",
          category: "PAYOUT",
          account,
          amount: sale.resellerPayout,
          date: paidAt,
          note: note || `Reversement vente ${sale.id.slice(0, 8)}`,
          relatedUserId: resellerId,
          relatedSaleId: sale.id,
        },
      });
      await t.sale.update({
        where: { id: sale.id },
        data: { paymentStatus: "PAID_TO_RESELLER", paidAt },
      });
    }
  });

  return NextResponse.json({ ok: true, count: sales.length, total });
}
