import { auth, currentUser } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import type { Role, User } from "@prisma/client";

const IMPERSONATE_COOKIE = "moov_act_as";

/**
 * Lit (ou crée) le User Prisma lié au Clerk userId courant.
 * - Si un User existe avec ce clerkId → renvoyé.
 * - Sinon, lookup par email : si un placeholder (invitation revendeur) existe,
 *   on attache le clerkId.
 * - Sinon création : premier utilisateur = ADMIN, suivants = RESELLER.
 * - Renvoie null si pas de session Clerk.
 */
async function getClerkDbUser(): Promise<User | null> {
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

/**
 * Lit le cookie d'impersonation (admin qui regarde l'espace d'un revendeur).
 * Renvoie null si pas de cookie OU si l'utilisateur Clerk courant n'est PAS admin
 * (sécurité : seul l'admin peut impersonifier).
 */
async function getImpersonatedUser(realUser: User): Promise<User | null> {
  if (realUser.role !== "ADMIN") return null;
  const jar = await cookies();
  const id = jar.get(IMPERSONATE_COOKIE)?.value;
  if (!id) return null;
  return prisma.user.findUnique({ where: { id } });
}

/**
 * Utilisateur courant (impersonifié si le cookie est posé par l'admin).
 */
export async function getOrCreateDbUser(): Promise<User | null> {
  const real = await getClerkDbUser();
  if (!real) return null;
  const impersonated = await getImpersonatedUser(real);
  return impersonated ?? real;
}

/**
 * Exige une session Clerk → utilisateur Prisma (avec impersonation appliquée).
 * Redirige vers /sign-in sinon.
 */
export async function requireUser(): Promise<User> {
  const user = await getOrCreateDbUser();
  if (!user) redirect("/sign-in");
  return user;
}

/**
 * Exige le rôle ADMIN (sur le user RÉEL, ignore l'impersonation).
 * Redirige vers /sign-in si pas connecté, vers /my/items si pas admin.
 */
export async function requireAdmin(): Promise<User> {
  const real = await getClerkDbUser();
  if (!real) redirect("/sign-in");
  if (real.role !== "ADMIN") redirect("/my/items");
  return real;
}

/**
 * Pour les pages /my/* : n'importe quel utilisateur connecté (admin ou reseller).
 */
export async function requireReseller(): Promise<User> {
  return requireUser();
}

/**
 * Contexte d'impersonation (pour afficher la bannière).
 * Renvoie isImpersonating=true uniquement si l'admin réel est connecté
 * ET qu'il y a un cookie pointant sur un autre user.
 */
export async function getImpersonationContext(): Promise<{
  isImpersonating: boolean;
  user: User | null;
}> {
  const real = await getClerkDbUser();
  if (!real || real.role !== "ADMIN") {
    return { isImpersonating: false, user: null };
  }
  const impersonated = await getImpersonatedUser(real);
  return { isImpersonating: !!impersonated, user: impersonated };
}
