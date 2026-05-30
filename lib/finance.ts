import { prisma } from "./prisma";
import type { Account, TransactionType } from "@prisma/client";

/**
 * Impact cash signé d'une transaction selon son type.
 * INCOME → +amount ; les autres → -amount.
 */
export function signedAmount(type: TransactionType, amount: number): number {
  return type === "INCOME" ? amount : -amount;
}

export interface CashByAccount {
  account: Account;
  balance: number;
}

/**
 * Solde par compte = sum(signedAmount(transactions)).
 */
export async function cashByAccount(): Promise<CashByAccount[]> {
  const accounts: Account[] = ["CASH", "BANK", "PAYPAL", "REVOLUT", "OTHER"];

  // SQL agrégé direct serait plus rapide ; ici on garde simple avec un fetch.
  const txs = await prisma.transaction.findMany({
    select: { account: true, type: true, amount: true },
  });

  const map = new Map<Account, number>();
  accounts.forEach((a) => map.set(a, 0));
  for (const t of txs) {
    map.set(t.account, (map.get(t.account) ?? 0) + signedAmount(t.type, t.amount));
  }
  return accounts.map((account) => ({ account, balance: map.get(account) ?? 0 }));
}

export async function totalCash(): Promise<number> {
  const rows = await cashByAccount();
  return rows.reduce((s, r) => s + r.balance, 0);
}

/**
 * Dettes restantes envers les revendeurs (paymentStatus = PENDING).
 */
export interface DebtRow {
  userId: string;
  name: string | null;
  email: string;
  amount: number;
  pendingSalesCount: number;
}

export async function pendingPayoutsByReseller(): Promise<DebtRow[]> {
  const rows = await prisma.sale.groupBy({
    by: ["resellerId"],
    where: { paymentStatus: "PENDING", resellerPayout: { gt: 0 } },
    _sum: { resellerPayout: true },
    _count: true,
  });

  if (rows.length === 0) return [];
  const users = await prisma.user.findMany({
    where: { id: { in: rows.map((r) => r.resellerId) } },
    select: { id: true, name: true, email: true },
  });
  const byId = new Map(users.map((u) => [u.id, u]));

  return rows
    .map((r) => {
      const u = byId.get(r.resellerId);
      return {
        userId: r.resellerId,
        name: u?.name ?? null,
        email: u?.email ?? "",
        amount: r._sum.resellerPayout ?? 0,
        pendingSalesCount: r._count,
      };
    })
    .sort((a, b) => b.amount - a.amount);
}

/**
 * Série mensuelle CA + profit pour les N derniers mois.
 */
export async function monthlyRevenueProfit(monthsBack: number = 12) {
  const since = new Date();
  since.setMonth(since.getMonth() - monthsBack + 1);
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  const sales = await prisma.sale.findMany({
    where: { soldAt: { gte: since } },
    select: { soldAt: true, soldPrice: true, netProfit: true, grossProfit: true },
  });

  const buckets = new Map<string, { revenue: number; netProfit: number; grossProfit: number; count: number }>();
  for (let i = 0; i < monthsBack; i++) {
    const d = new Date(since);
    d.setMonth(d.getMonth() + i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    buckets.set(key, { revenue: 0, netProfit: 0, grossProfit: 0, count: 0 });
  }

  for (const s of sales) {
    const d = new Date(s.soldAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const b = buckets.get(key);
    if (!b) continue;
    b.revenue += s.soldPrice;
    b.netProfit += s.netProfit;
    b.grossProfit += s.grossProfit;
    b.count += 1;
  }

  return Array.from(buckets.entries()).map(([key, v]) => ({
    month: key,
    label: formatMonthLabel(key),
    revenue: round2(v.revenue),
    netProfit: round2(v.netProfit),
    grossProfit: round2(v.grossProfit),
    sales: v.count,
  }));
}

export async function topCategories(limit: number = 6) {
  const rows = await prisma.sale.findMany({
    select: { soldPrice: true, netProfit: true, item: { select: { category: true } } },
  });
  const map = new Map<string, { revenue: number; profit: number; count: number }>();
  for (const s of rows) {
    const k = s.item.category?.trim() || "Sans catégorie";
    const cur = map.get(k) ?? { revenue: 0, profit: 0, count: 0 };
    cur.revenue += s.soldPrice;
    cur.profit += s.netProfit;
    cur.count += 1;
    map.set(k, cur);
  }
  return Array.from(map.entries())
    .map(([category, v]) => ({ category, revenue: round2(v.revenue), profit: round2(v.profit), count: v.count }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

export async function revenueByReseller() {
  const rows = await prisma.sale.groupBy({
    by: ["resellerId"],
    _sum: { soldPrice: true, netProfit: true },
    _count: true,
  });
  if (rows.length === 0) return [];
  const users = await prisma.user.findMany({
    where: { id: { in: rows.map((r) => r.resellerId) } },
    select: { id: true, name: true, email: true },
  });
  const byId = new Map(users.map((u) => [u.id, u]));
  return rows
    .map((r) => ({
      userId: r.resellerId,
      label: byId.get(r.resellerId)?.name ?? byId.get(r.resellerId)?.email ?? "—",
      revenue: round2(r._sum.soldPrice ?? 0),
      netProfit: round2(r._sum.netProfit ?? 0),
      sales: r._count,
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

/**
 * Série quotidienne CA + profit pour les N derniers jours (sparklines).
 */
export async function dailyRevenue(days: number = 30) {
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - (days - 1));

  const sales = await prisma.sale.findMany({
    where: { soldAt: { gte: since } },
    select: { soldAt: true, soldPrice: true, netProfit: true },
  });

  const buckets = new Map<string, { revenue: number; profit: number; count: number }>();
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    const key = ymd(d);
    buckets.set(key, { revenue: 0, profit: 0, count: 0 });
  }
  for (const s of sales) {
    const key = ymd(new Date(s.soldAt));
    const b = buckets.get(key);
    if (!b) continue;
    b.revenue += s.soldPrice;
    b.profit += s.netProfit;
    b.count += 1;
  }
  return Array.from(buckets.entries()).map(([date, v]) => ({
    date,
    revenue: round2(v.revenue),
    profit: round2(v.profit),
    sales: v.count,
  }));
}

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Multiplicateur moyen prix vendu / prix d'achat sur toutes les ventes.
 * Renvoie 0 si aucune vente.
 */
export async function averageMultiplier(): Promise<{
  multiplier: number;
  totalSold: number;
  totalPurchase: number;
  sales: number;
}> {
  const sales = await prisma.sale.findMany({
    select: { soldPrice: true, item: { select: { purchasePrice: true } } },
  });
  if (sales.length === 0) return { multiplier: 0, totalSold: 0, totalPurchase: 0, sales: 0 };

  let totalSold = 0;
  let totalPurchase = 0;
  for (const s of sales) {
    totalSold += s.soldPrice;
    totalPurchase += s.item.purchasePrice;
  }
  return {
    multiplier: totalPurchase > 0 ? totalSold / totalPurchase : 0,
    totalSold: round2(totalSold),
    totalPurchase: round2(totalPurchase),
    sales: sales.length,
  };
}

/**
 * Série mensuelle : profit net + coûts par catégorie (STOCK_BUY, SUPPLIES).
 * Sert au graphique "Profit & coûts".
 */
export async function monthlyProfitWithCosts(monthsBack: number = 12) {
  const since = new Date();
  since.setMonth(since.getMonth() - monthsBack + 1);
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  const [sales, txs] = await Promise.all([
    prisma.sale.findMany({
      where: { soldAt: { gte: since } },
      select: { soldAt: true, netProfit: true },
    }),
    prisma.transaction.findMany({
      where: {
        date: { gte: since },
        category: { in: ["STOCK_BUY", "SUPPLIES"] },
      },
      select: { date: true, amount: true, category: true },
    }),
  ]);

  type Bucket = { netProfit: number; stockCost: number; suppliesCost: number };
  const buckets = new Map<string, Bucket>();

  for (let i = 0; i < monthsBack; i++) {
    const d = new Date(since);
    d.setMonth(d.getMonth() + i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    buckets.set(key, { netProfit: 0, stockCost: 0, suppliesCost: 0 });
  }

  for (const s of sales) {
    const d = new Date(s.soldAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const b = buckets.get(key);
    if (b) b.netProfit += s.netProfit;
  }
  for (const t of txs) {
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const b = buckets.get(key);
    if (!b) continue;
    if (t.category === "STOCK_BUY") b.stockCost += t.amount;
    else if (t.category === "SUPPLIES") b.suppliesCost += t.amount;
  }

  return Array.from(buckets.entries()).map(([key, v]) => ({
    month: key,
    label: formatMonthLabel(key),
    netProfit: round2(v.netProfit),
    stockCost: round2(v.stockCost),
    suppliesCost: round2(v.suppliesCost),
  }));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function formatMonthLabel(yyyymm: string): string {
  const [y, m] = yyyymm.split("-").map(Number);
  return new Intl.DateTimeFormat("fr-FR", { month: "short", year: "2-digit" }).format(
    new Date(y, m - 1, 1),
  );
}
