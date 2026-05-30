import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Se promouvoir ADMIN s'il n'y a aucun autre vrai admin (avec clerkId).
 * Utile pour le tout premier utilisateur si un placeholder existait déjà.
 */
export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const me = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!me) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

  if (me.role === "ADMIN") {
    return NextResponse.json({ ok: true, alreadyAdmin: true });
  }

  // Empêche le hold-up si un vrai admin existe déjà
  const realAdminCount = await prisma.user.count({
    where: { role: "ADMIN", clerkId: { not: null } },
  });
  if (realAdminCount > 0) {
    return NextResponse.json(
      { error: "Un admin réel existe déjà, contacte-le pour qu'il te promeuve." },
      { status: 403 },
    );
  }

  // Promeut + désactive les placeholders ADMIN sans clerkId
  await prisma.$transaction([
    prisma.user.updateMany({
      where: { role: "ADMIN", clerkId: null },
      data: { active: false },
    }),
    prisma.user.update({
      where: { id: me.id },
      data: { role: "ADMIN" },
    }),
  ]);

  const clerkUser = await currentUser();
  return NextResponse.json({
    ok: true,
    promoted: true,
    name: clerkUser?.firstName ?? me.email,
  });
}
