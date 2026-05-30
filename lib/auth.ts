import { cookies } from "next/headers";
import { prisma } from "./prisma";
import type { User } from "@prisma/client";

const DEFAULT_EMAIL = "admin@moovstock.local";
const DEFAULT_NAME = "Admin";
const IMPERSONATE_COOKIE = "moov_act_as";

/**
 * Lit le cookie d'impersonation (admin qui regarde l'espace d'un revendeur).
 */
async function getImpersonatedUser(): Promise<User | null> {
  const jar = await cookies();
  const id = jar.get(IMPERSONATE_COOKIE)?.value;
  if (!id) return null;
  return prisma.user.findUnique({ where: { id } });
}

/**
 * Retourne / crée l'utilisateur Admin par défaut.
 */
async function getDefaultAdmin(): Promise<User> {
  let user = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    orderBy: { createdAt: "asc" },
  });
  if (user) return user;
  return prisma.user.create({
    data: {
      email: DEFAULT_EMAIL,
      name: DEFAULT_NAME,
      role: "ADMIN",
      active: true,
    },
  });
}

/**
 * Utilisateur courant : impersonifié si cookie présent, sinon Admin.
 */
export async function getOrCreateDbUser(): Promise<User> {
  const impersonated = await getImpersonatedUser();
  if (impersonated) return impersonated;
  return getDefaultAdmin();
}

export async function requireUser(): Promise<User> {
  return getOrCreateDbUser();
}

/**
 * Admin réel (ignore l'impersonation) — pour les actions qui n'ont de sens
 * que pour le propriétaire du tableau de bord.
 */
export async function requireAdmin(): Promise<User> {
  return getDefaultAdmin();
}

export async function requireReseller(): Promise<User> {
  return getOrCreateDbUser();
}

/**
 * Retourne le user impersonifié (ou null) — utile pour afficher la bannière.
 */
export async function getImpersonationContext(): Promise<{
  isImpersonating: boolean;
  user: User | null;
}> {
  const user = await getImpersonatedUser();
  return { isImpersonating: !!user, user };
}
