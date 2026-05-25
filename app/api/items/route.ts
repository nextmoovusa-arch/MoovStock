import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

const CreateItemSchema = z.object({
  title: z.string().min(1).max(200),
  brand: z.string().max(80).optional().nullable(),
  category: z.string().max(80).optional().nullable(),
  size: z.string().max(40).optional().nullable(),
  condition: z.string().max(60).optional().nullable(),
  purchasePrice: z.number().min(0),
  listingPrice: z.number().min(0).optional().default(0),
  photoUrl: z.string().url().optional().or(z.literal("")).nullable(),
  vintedUrl: z.string().url().optional().or(z.literal("")).nullable(),
  status: z.enum(["IN_STOCK", "LISTED"]).optional().default("IN_STOCK"),
  notes: z.string().max(2000).optional().nullable(),
});

export async function POST(req: Request) {
  const user = await requireUser();
  const json = await req.json().catch(() => null);
  const parsed = CreateItemSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides", issues: parsed.error.issues }, { status: 400 });
  }
  const data = parsed.data;

  const item = await prisma.item.create({
    data: {
      userId: user.id,
      title: data.title,
      brand: data.brand || null,
      category: data.category || null,
      size: data.size || null,
      condition: data.condition || null,
      purchasePrice: data.purchasePrice,
      listingPrice: data.listingPrice ?? 0,
      photoUrl: data.photoUrl || null,
      vintedUrl: data.vintedUrl || null,
      status: data.status,
      listedAt: data.status === "LISTED" ? new Date() : null,
      notes: data.notes || null,
    },
  });

  return NextResponse.json({ item });
}
