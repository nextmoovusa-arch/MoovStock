import { prisma } from "./prisma";
import type { Supply, SupplyType } from "@prisma/client";

const DEFAULT_LEAD_DAYS = 3;
const DEFAULT_SAFETY_DAYS = 2;
const WINDOW_DAYS = 7;

/**
 * Conso quotidienne moyenne sur les 7 derniers DailyLog,
 * pour le type de consommable donné.
 */
export async function avgDailyUsage(
  userId: string,
  type: SupplyType,
): Promise<number> {
  if (type !== "POUCH" && type !== "LABEL_ROLL") return 0;

  const since = new Date(Date.now() - WINDOW_DAYS * 86400000);
  const logs = await prisma.dailyLog.findMany({
    where: { userId, date: { gte: since } },
    select: { pouchesUsed: true, labelsUsed: true },
  });

  if (logs.length === 0) return 0;
  const total = logs.reduce(
    (s, l) => s + (type === "POUCH" ? l.pouchesUsed : l.labelsUsed),
    0,
  );
  return total / WINDOW_DAYS;
}

export interface RestockAnalysis {
  avgDaily: number;
  daysRemaining: number | null; // null si conso = 0
  thresholdUnits: number;       // seuil en unités
  needsRestock: boolean;
  critical: boolean;            // < 1 jour de stock
}

/**
 * Analyse de l'état d'un supply : doit-on commander maintenant ?
 *   threshold (unités) = avgDaily * (leadDays + safetyMargin)
 * Si restockThreshold est défini manuellement, il prévaut.
 */
export async function analyzeSupply(supply: Supply): Promise<RestockAnalysis> {
  const avgDaily = await avgDailyUsage(supply.userId, supply.type);

  const leadDays = supply.restockLeadDays ?? DEFAULT_LEAD_DAYS;
  const safetyDays = supply.safetyMarginDays ?? DEFAULT_SAFETY_DAYS;

  const computedThreshold = Math.ceil(avgDaily * (leadDays + safetyDays));
  const thresholdUnits =
    supply.restockThreshold !== null && supply.restockThreshold !== undefined
      ? supply.restockThreshold
      : computedThreshold;

  const daysRemaining = avgDaily > 0 ? supply.quantity / avgDaily : null;
  const needsRestock = supply.quantity <= thresholdUnits;
  const critical = avgDaily > 0 && supply.quantity / avgDaily < 1;

  return { avgDaily, daysRemaining, thresholdUnits, needsRestock, critical };
}

/**
 * Applique un mouvement de stock atomiquement.
 * Refuse de descendre le stock sous 0 (sauf MANUAL_ADJUST négatif explicite : on autorise).
 */
export async function applyMovement(params: {
  supplyId: string;
  delta: number;
  reason: "RESTOCK" | "CONSUMPTION" | "MANUAL_ADJUST" | "LOSS";
  note?: string;
  dailyLogId?: string;
}) {
  return prisma.$transaction(async (tx) => {
    const supply = await tx.supply.findUnique({ where: { id: params.supplyId } });
    if (!supply) throw new Error("Supply introuvable");

    const newQty = supply.quantity + params.delta;
    // garde-fou : on n'autorise pas un stock négatif pour CONSUMPTION
    const finalQty =
      params.reason === "CONSUMPTION" && newQty < 0 ? 0 : newQty;

    await tx.supplyMovement.create({
      data: {
        supplyId: supply.id,
        delta: params.delta,
        reason: params.reason,
        note: params.note ?? null,
        dailyLogId: params.dailyLogId ?? null,
      },
    });

    return tx.supply.update({
      where: { id: supply.id },
      data: {
        quantity: finalQty,
        lastRestockedAt: params.reason === "RESTOCK" ? new Date() : supply.lastRestockedAt,
      },
    });
  });
}

/**
 * Décrémente automatiquement les supplies POUCH et LABEL_ROLL
 * en fonction du delta de consommation d'une DailyLog (upsert).
 * - prevPouches / prevLabels = 0 lors d'une création.
 */
export async function applyDailyLogConsumption(params: {
  userId: string;
  dailyLogId: string;
  pouchesUsed: number;
  labelsUsed: number;
  prevPouches: number;
  prevLabels: number;
}) {
  const pouchDelta = params.pouchesUsed - params.prevPouches;
  const labelDelta = params.labelsUsed - params.prevLabels;

  if (pouchDelta !== 0) {
    const supply = await firstActiveSupply(params.userId, "POUCH");
    if (supply) {
      await applyMovement({
        supplyId: supply.id,
        delta: -pouchDelta, // conso négative
        reason: pouchDelta > 0 ? "CONSUMPTION" : "MANUAL_ADJUST",
        note: pouchDelta > 0 ? "Saisie quotidienne" : "Correction saisie quotidienne",
        dailyLogId: params.dailyLogId,
      });
    }
  }

  if (labelDelta !== 0) {
    const supply = await firstActiveSupply(params.userId, "LABEL_ROLL");
    if (supply) {
      await applyMovement({
        supplyId: supply.id,
        delta: -labelDelta,
        reason: labelDelta > 0 ? "CONSUMPTION" : "MANUAL_ADJUST",
        note: labelDelta > 0 ? "Saisie quotidienne" : "Correction saisie quotidienne",
        dailyLogId: params.dailyLogId,
      });
    }
  }
}

async function firstActiveSupply(userId: string, type: SupplyType) {
  return prisma.supply.findFirst({
    where: { userId, type, active: true },
    orderBy: { createdAt: "asc" },
  });
}
