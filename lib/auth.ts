import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import type { Role, User } from "@prisma/client";

/**
 * Renvoie l'utilisateur DB lié au Clerk user courant.
 * - Si un User existe déjà avec ce clerkId → renvoyé tel quel.
 * - Sinon, si un User placeholder existe pour cet email (créé via "Inviter
 *   revendeur"), on l'attache au clerkId.
 * - Sinon on crée un nouveau (ADMIN si premier, RESELLER sinon).
 */
export async function getOrCreateDbUser(): Promise<User | null> {
  const { userId } = await auth();
  if (!userId) return null;

  let user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (user) return user;

  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email =
    clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)
      ?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress;

  if (!email) return null;
  const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null;

  // Lookup par email — si un placeholder existe, on l'attache
  const placeholder = await prisma.user.findUnique({ where: { email } });
  if (placeholder) {
    user = await prisma.user.update({
      where: { id: placeholder.id },
      data: {
        clerkId: userId,
        name: placeholder.name ?? name,
        imageUrl: clerkUser.imageUrl,
      },
    });
    return user;
  }

  // Premier utilisateur inscrit = ADMIN automatique
  const userCount = await prisma.user.count();
  const role: Role = userCount === 0 ? "ADMIN" : "RESELLER";

  user = await prisma.user.create({
    data: {
      clerkId: userId,
      email,
      name,
      imageUrl: clerkUser.imageUrl,
      role,
    },
  });

  return user;
}

export async function requireUser(): Promise<User> {
  const user = await getOrCreateDbUser();
  if (!user) redirect("/sign-in");
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/my/items");
  return user;
}

export async function requireReseller(): Promise<User> {
  const user = await requireUser();
  // L'admin a aussi accès aux pages revendeur (vue lui-même)
  return user;
}
