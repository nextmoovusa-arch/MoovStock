import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

const PatchSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  brand: z.string().max(80).nullable().optional(),
  category: z.string().max(80).nullable().optional(),
  subcategory: z.string().max(120).nullable().optional(),
  size: z.string().max(40).nullable().optional(),
  condition: z.string().max(60).nullable().optional(),
  purchasePrice: z.number().min(0).optional(),
  listingPrice: z.number().min(0).optional(),
  photoUrl: z.string().url().or(z.literal("")).nullable().optional(),
  vintedUrl: z.string().url().or(z.literal("")).nullable().optional(),
  status: z.enum(["IN_STOCK", "LISTED", "RETURNED", "LOST"]).optional(),
  notes: z.string().max(2000).nullable().optional(),
  republish: z.boolean().optional(), // remet listedAt à now sans toucher au statut
});

async function loadOwned(id: string, userId: string, isAdmin: boolean) {
  const item = await prisma.item.findUnique({ where: { id } });
  if (!item) return null;
  if (!isAdmin && item.userId !== userId) return null;
  return item;
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await ctx.params;
  const item = await loadOwned(id, user.id, user.role === "ADMIN");
  if (!item) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  if (item.status === "SOLD") {
    return NextResponse.json({ error: "Article déjà vendu" }, { status: 409 });
  }

  const json = await req.json().catch(() => null);
  const parsed = PatchSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  const { republish, ...rest } = parsed.data;

  // Republier : on rafraîchit la date de mise en ligne, statut LISTED
  const nowListed =
    republish ||
    (parsed.data.status === "LISTED" && item.status !== "LISTED");

  const updated = await prisma.item.update({
    where: { id },
    data: {
      ...rest,
      ...(republish ? { status: "LISTED" as const } : {}),
      listedAt: nowListed ? new Date() : item.listedAt,
    },
  });
  return NextResponse.json({ item: updated });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await ctx.params;
  const item = await loadOwned(id, user.id, user.role === "ADMIN");
  if (!item) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  if (item.status === "SOLD") {
    return NextResponse.json({ error: "Impossible : article déjà vendu" }, { status: 409 });
  }
  await prisma.item.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
