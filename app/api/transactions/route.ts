import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

const CreateSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE", "RESELLER_PAYOUT", "REFUND"]),
  category: z.enum([
    "STOCK_BUY", "SUPPLIES", "SHIPPING", "AD", "PAYOUT",
    "REFUND", "EQUIPMENT", "TRANSPORT", "OTHER",
  ]),
  account: z.enum(["CASH", "BANK", "PAYPAL", "REVOLUT", "OTHER"]),
  amount: z.number().positive(),
  date: z.string().datetime().optional(),
  note: z.string().max(500).optional().nullable(),
  relatedUserId: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  await requireAdmin();
  const json = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides", issues: parsed.error.issues }, { status: 400 });
  }
  const d = parsed.data;
  const tx = await prisma.transaction.create({
    data: {
      type: d.type,
      category: d.category,
      account: d.account,
      amount: d.amount,
      date: d.date ? new Date(d.date) : new Date(),
      note: d.note || null,
      relatedUserId: d.relatedUserId || null,
    },
  });
  return NextResponse.json({ transaction: tx });
}
