import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

const Schema = z.object({
  businessMode: z.boolean().optional(),
  taxRate: z.number().min(0).max(1).optional(),
  urssafRate: z.number().min(0).max(1).optional(),
});

export async function PATCH(req: Request) {
  const admin = await requireAdmin();
  const json = await req.json().catch(() => null);
  const parsed = Schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }
  const updated = await prisma.user.update({
    where: { id: admin.id },
    data: parsed.data,
  });
  return NextResponse.json({
    businessMode: updated.businessMode,
    taxRate: updated.taxRate,
    urssafRate: updated.urssafRate,
  });
}
