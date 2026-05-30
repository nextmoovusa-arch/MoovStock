import { prisma } from "./prisma";
import type { User } from "@prisma/client";

const DEFAULT_EMAIL = "admin@moovstock.local";
const DEFAULT_NAME = "Admin";

/**
 * Auth désactivée. Tout le monde est mappé sur un utilisateur ADMIN
 * unique, créé automatiquement au premier appel.
 */
export async function getOrCreateDbUser(): Promise<User> {
  let user = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    orderBy: { createdAt: "asc" },
  });
  if (user) return user;

  user = await prisma.user.create({
    data: {
      email: DEFAULT_EMAIL,
      name: DEFAULT_NAME,
      role: "ADMIN",
      active: true,
    },
  });
  return user;
}

export async function requireUser(): Promise<User> {
  return getOrCreateDbUser();
}

export async function requireAdmin(): Promise<User> {
  return getOrCreateDbUser();
}

export async function requireReseller(): Promise<User> {
  return getOrCreateDbUser();
}
