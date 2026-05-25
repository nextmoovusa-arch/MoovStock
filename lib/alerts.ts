import { prisma } from "./prisma";
import type { AlertType, AlertSeverity, User } from "@prisma/client";

const INACTIVITY_THRESHOLD_DAYS = 2;

/**
 * Crée une alerte (ouverte) si une équivalente n'existe pas déjà non résolue.
 * Évite les doublons sur (userId, type) tant que la précédente n'est pas resolved.
 */
async function openAlert(params: {
  userId: string | null;
  type: AlertType;
  severity?: AlertSeverity;
  message: string;
  meta?: Record<string, unknown>;
}) {
  const existing = await prisma.alert.findFirst({
    where: {
      userId: params.userId,
      type: params.type,
      resolvedAt: null,
    },
  });
  if (existing) return existing;
  return prisma.alert.create({
    data: {
      userId: params.userId,
      type: params.type,
      severity: params.severity ?? "WARNING",
      message: params.message,
      meta: params.meta ? (params.meta as object) : undefined,
    },
  });
}

async function resolveAlerts(userId: string | null, type: AlertType) {
  await prisma.alert.updateMany({
    where: { userId, type, resolvedAt: null },
    data: { resolvedAt: new Date() },
  });
}

/**
 * Vérifie la dernière DailyLog d'un revendeur et lève / résout INACTIVITY.
 */
export async function checkInactivity(user: Pick<User, "id" | "name" | "email">) {
  const last = await prisma.dailyLog.findFirst({
    where: { userId: user.id },
    orderBy: { date: "desc" },
  });

  const now = new Date();
  const daysSince = last
    ? Math.floor((now.getTime() - new Date(last.date).getTime()) / 86400000)
    : Infinity;

  if (daysSince > INACTIVITY_THRESHOLD_DAYS) {
    const label = user.name ?? user.email;
    const msg =
      daysSince === Infinity
        ? `${label} n'a encore jamais soumis de saisie quotidienne.`
        : `${label} n'a pas saisi depuis ${daysSince} jour(s).`;
    await openAlert({
      userId: user.id,
      type: "INACTIVITY",
      severity: daysSince > 4 ? "CRITICAL" : "WARNING",
      message: msg,
      meta: { daysSince: daysSince === Infinity ? null : daysSince },
    });
  } else {
    await resolveAlerts(user.id, "INACTIVITY");
  }
}

/**
 * À appeler après chaque DailyLog : vérifie l'objectif du jour.
 */
export async function checkGoalForLog(
  user: Pick<User, "id" | "name" | "email" | "dailyGoalItems">,
  log: { itemsListed: number; date: Date | string },
) {
  if (user.dailyGoalItems <= 0) return;

  // L'alerte d'objectif manqué = on lève au plus tard en fin de journée.
  // Ici on traite à la saisie : si la saisie concerne un jour passé, ou si la
  // saisie d'aujourd'hui montre déjà un déficit, on alerte.
  const logDate = new Date(log.date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isPast = logDate < today;

  if (isPast && log.itemsListed < user.dailyGoalItems) {
    const label = user.name ?? user.email;
    await openAlert({
      userId: user.id,
      type: "GOAL_MISSED",
      severity: "WARNING",
      message: `${label} a posté ${log.itemsListed}/${user.dailyGoalItems} articles le ${logDate.toLocaleDateString("fr-FR")}.`,
      meta: { date: logDate.toISOString(), goal: user.dailyGoalItems, achieved: log.itemsListed },
    });
  }
}

/**
 * Détection : pochettes utilisées >> ventes sur la même fenêtre.
 * Lève STOCK_MISMATCH si différence > 20%.
 */
export async function checkStockMismatch(user: Pick<User, "id" | "name" | "email">) {
  const since = new Date(Date.now() - 7 * 86400000);
  const [logs, salesCount] = await Promise.all([
    prisma.dailyLog.findMany({
      where: { userId: user.id, date: { gte: since } },
    }),
    prisma.sale.count({ where: { resellerId: user.id, soldAt: { gte: since } } }),
  ]);
  const pouches = logs.reduce((s, l) => s + l.pouchesUsed, 0);
  if (pouches === 0 && salesCount === 0) return;

  const diffRatio =
    salesCount === 0 ? 1 : Math.abs(pouches - salesCount) / Math.max(pouches, salesCount);

  if (diffRatio > 0.2 && Math.abs(pouches - salesCount) >= 3) {
    const label = user.name ?? user.email;
    await openAlert({
      userId: user.id,
      type: "STOCK_MISMATCH",
      severity: "INFO",
      message: `${label} : ${salesCount} ventes vs ${pouches} pochettes utilisées sur 7 j.`,
      meta: { salesCount, pouches, windowDays: 7 },
    });
  } else {
    await resolveAlerts(user.id, "STOCK_MISMATCH");
  }
}

/**
 * Scan complet de tous les revendeurs actifs.
 * Appelable depuis une route API (cron Vercel) ou un bouton admin.
 */
export async function runAlertScan(): Promise<{ scanned: number }> {
  const resellers = await prisma.user.findMany({
    where: { role: "RESELLER", active: true },
    select: { id: true, name: true, email: true, dailyGoalItems: true },
  });

  for (const u of resellers) {
    await checkInactivity(u);
    await checkStockMismatch(u);
  }

  return { scanned: resellers.length };
}
