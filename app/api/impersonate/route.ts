import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const Schema = z.object({
  resellerId: z.string().min(1).nullable().optional(),
});

const COOKIE = "moov_act_as";
const MAX_AGE = 60 * 60 * 6; // 6h

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = Schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 });

  const jar = await cookies();

  if (!parsed.data.resellerId) {
    jar.delete(COOKIE);
    return NextResponse.json({ ok: true, cleared: true });
  }

  const user = await prisma.user.findUnique({
    where: { id: parsed.data.resellerId },
    select: { id: true, name: true, email: true, role: true },
  });
  if (!user) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  jar.set({
    name: COOKIE,
    value: user.id,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
  return NextResponse.json({ ok: true, viewingAs: user.name ?? user.email });
}

export async function DELETE() {
  const jar = await cookies();
  jar.delete(COOKIE);
  return NextResponse.json({ ok: true, cleared: true });
}
