import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import type { Role, User } from "@prisma/client";

/**
 * Renvoie l'utilisateur DB lié au Clerk user courant.
 * Le crée à la volée si le webhook n'a pas encore tourné.
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

  // Premier utilisateur inscrit = ADMIN automatique
  const userCount = await prisma.user.count();
  const role: Role = userCount === 0 ? "ADMIN" : "RESELLER";

  user = await prisma.user.create({
    data: {
      clerkId: userId,
      email,
      name: [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null,
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
