import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

const InviteSchema = z.object({
  email: z.string().email(),
  name: z.string().max(120).optional().nullable(),
  dailyGoalItems: z.number().int().min(0).max(1000).optional().default(5),
  commissionRate: z.number().min(0).max(1).optional().default(0.5),
});

/**
 * Crée un revendeur "placeholder" : le User existe en BDD avec rôle RESELLER,
 * email pré-rempli, objectif et commission configurés, mais clerkId null.
 *
 * Quand la personne s'inscrit via /sign-up avec ce même email, getOrCreateDbUser
 * attache automatiquement son clerkId à ce placeholder.
 */
export async function POST(req: Request) {
  await requireAdmin();
  const json = await req.json().catch(() => null);
  const parsed = InviteSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const d = parsed.data;
  const email = d.email.toLowerCase().trim();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "Un compte existe déjà avec cet email." },
      { status: 409 },
    );
  }

  const user = await prisma.user.create({
    data: {
      email,
      name: d.name || null,
      role: "RESELLER",
      dailyGoalItems: d.dailyGoalItems,
      commissionRate: d.commissionRate,
      active: true,
    },
  });

  return NextResponse.json({ user });
}
