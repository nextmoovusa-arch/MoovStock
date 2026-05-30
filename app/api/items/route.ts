import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

const CreateItemSchema = z.object({
  title: z.string().min(1).max(200),
  brand: z.string().max(80).optional().nullable(),
  category: z.string().max(80).optional().nullable(),
  subcategory: z.string().max(120).optional().nullable(),
  size: z.string().max(40).optional().nullable(),
  condition: z.string().max(60).optional().nullable(),
  purchasePrice: z.number().min(0),
  listingPrice: z.number().min(0).optional().default(0),
  photoUrl: z.string().url().optional().or(z.literal("")).nullable(),
  vintedUrl: z.string().url().optional().or(z.literal("")).nullable(),
  status: z.enum(["IN_STOCK", "LISTED"]).optional().default("IN_STOCK"),
  notes: z.string().max(2000).optional().nullable(),
  quantity: z.number().int().min(1).max(500).optional().default(1),
});

const MAX_BATCH = 500;

export async function POST(req: Request) {
  const user = await requireUser();
  const json = await req.json().catch(() => null);
  const parsed = CreateItemSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides", issues: parsed.error.issues }, { status: 400 });
  }
  const data = parsed.data;
  const quantity = Math.min(MAX_BATCH, Math.max(1, data.quantity ?? 1));

  const now = new Date();
  const base = {
    userId: user.id,
    title: data.title,
    brand: data.brand || null,
    category: data.category || null,
    subcategory: data.subcategory || null,
    size: data.size || null,
    condition: data.condition || null,
    purchasePrice: data.purchasePrice,
    listingPrice: data.listingPrice ?? 0,
    photoUrl: data.photoUrl || null,
    vintedUrl: data.vintedUrl || null,
    status: data.status,
    listedAt: data.status === "LISTED" ? now : null,
    notes: data.notes || null,
  };

  if (quantity === 1) {
    const item = await prisma.item.create({ data: base });
    return NextResponse.json({ item, count: 1 });
  }

  // Création en lot : N rows identiques
  const result = await prisma.item.createMany({
    data: Array.from({ length: quantity }, () => base),
  });

  return NextResponse.json({ count: result.count });
}
