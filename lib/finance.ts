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

/**
 * Statistiques agrégées par catégorie (et sous-catégorie).
 * - sales : nombre de ventes
 * - revenue, profit : sommes
 * - avgMultiplier : moyenne de (soldPrice / purchasePrice - 1)
 * - avgDaysToSell : jours moyens entre createdAt de l'item et soldAt
 * - stockListed : combien d'articles encore en stock dans cette catégorie
 */
export interface CategoryStat {
  category: string;
  subcategory: string | null;
  sales: number;
  revenue: number;
  profit: number;
  avgMultiplier: number;
  avgDaysToSell: number | null;
  stockListed: number;
}

export async function categoryStats(): Promise<CategoryStat[]> {
  const [sales, stock] = await Promise.all([
    prisma.sale.findMany({
      select: {
        soldPrice: true,
        netProfit: true,
        soldAt: true,
        item: {
          select: {
            category: true,
            subcategory: true,
            purchasePrice: true,
            createdAt: true,
          },
        },
      },
    }),
    prisma.item.groupBy({
      by: ["category", "subcategory"],
      where: { status: { in: ["IN_STOCK", "LISTED"] } },
      _count: true,
    }),
  ]);

  // Aggrégation des ventes
  const map = new Map<string, {
    category: string;
    subcategory: string | null;
    sales: number;
    revenue: number;
    profit: number;
    multSum: number;
    multCount: number;
    daysSum: number;
    daysCount: number;
  }>();

  for (const s of sales) {
    const cat = s.item.category ?? "Sans catégorie";
    const sub = s.item.subcategory ?? null;
    const key = `${cat}::${sub ?? ""}`;
    const bucket = map.get(key) ?? {
      category: cat,
      subcategory: sub,
      sales: 0,
      revenue: 0,
      profit: 0,
      multSum: 0,
      multCount: 0,
      daysSum: 0,
      daysCount: 0,
    };
    bucket.sales += 1;
    bucket.revenue += s.soldPrice;
    bucket.profit += s.netProfit;
    if (s.item.purchasePrice > 0) {
      bucket.multSum += s.soldPrice / s.item.purchasePrice - 1;
      bucket.multCount += 1;
    }
    if (s.item.createdAt && s.soldAt) {
      const days =
        (new Date(s.soldAt).getTime() - new Date(s.item.createdAt).getTime()) / 86400000;
      if (days >= 0) {
        bucket.daysSum += days;
        bucket.daysCount += 1;
      }
    }
    map.set(key, bucket);
  }

  // Stock encore présent
  const stockMap = new Map<string, number>();
  for (const s of stock) {
    const key = `${s.category ?? "Sans catégorie"}::${s.subcategory ?? ""}`;
    stockMap.set(key, (stockMap.get(key) ?? 0) + s._count);
  }
  // Ajout des entrées qui n'ont aucune vente mais ont du stock
  for (const [key, count] of stockMap.entries()) {
    if (!map.has(key)) {
      const [cat, sub] = key.split("::");
      map.set(key, {
        category: cat || "Sans catégorie",
        subcategory: sub || null,
        sales: 0,
        revenue: 0,
        profit: 0,
        multSum: 0,
        multCount: 0,
        daysSum: 0,
        daysCount: 0,
      });
    }
  }

  const result: CategoryStat[] = [];
  for (const [key, b] of map.entries()) {
    result.push({
      category: b.category,
      subcategory: b.subcategory,
      sales: b.sales,
      revenue: round2(b.revenue),
      profit: round2(b.profit),
      avgMultiplier: b.multCount > 0 ? b.multSum / b.multCount : 0,
      avgDaysToSell: b.daysCount > 0 ? b.daysSum / b.daysCount : null,
      stockListed: stockMap.get(key) ?? 0,
    });
  }

  return result;
}

/**
 * Distribution du multiplicateur (soldPrice/purchasePrice - 1).
 * Buckets : <0 (perte), 0-0.5, 0.5-1, 1-1.5, 1.5-2, 2-3, 3+
 */
export async function multiplierDistribution(): Promise<{ label: string; count: number }[]> {
  const sales = await prisma.sale.findMany({
    select: { soldPrice: true, item: { select: { purchasePrice: true } } },
  });
  const buckets = [
    { label: "Perte", min: -Infinity, max: 0 },
    { label: "×0–0.5", min: 0, max: 0.5 },
    { label: "×0.5–1", min: 0.5, max: 1 },
    { label: "×1–1.5", min: 1, max: 1.5 },
    { label: "×1.5–2", min: 1.5, max: 2 },
    { label: "×2–3", min: 2, max: 3 },
    { label: "×3+", min: 3, max: Infinity },
  ];
  const out = buckets.map((b) => ({ label: b.label, count: 0 }));
  for (const s of sales) {
    if (s.item.purchasePrice <= 0) continue;
    const m = s.soldPrice / s.item.purchasePrice - 1;
    const idx = buckets.findIndex((b) => m >= b.min && m < b.max);
    if (idx >= 0) out[idx].count += 1;
  }
  return out;
}

/**
 * Distribution du délai de vente (créé → vendu, en jours).
 */
export async function daysToSellDistribution(): Promise<{ label: string; count: number }[]> {
  const sales = await prisma.sale.findMany({
    select: { soldAt: true, item: { select: { createdAt: true } } },
  });
  const buckets = [
    { label: "< 1 j", min: 0, max: 1 },
    { label: "1–3 j", min: 1, max: 3 },
    { label: "3–7 j", min: 3, max: 7 },
    { label: "1–2 sem", min: 7, max: 14 },
    { label: "2–4 sem", min: 14, max: 30 },
    { label: "1–3 mois", min: 30, max: 90 },
    { label: "3 mois +", min: 90, max: Infinity },
  ];
  const out = buckets.map((b) => ({ label: b.label, count: 0 }));
  for (const s of sales) {
    if (!s.item.createdAt) continue;
    const days =
      (new Date(s.soldAt).getTime() - new Date(s.item.createdAt).getTime()) / 86400000;
    if (days < 0) continue;
    const idx = buckets.findIndex((b) => days >= b.min && days < b.max);
    if (idx >= 0) out[idx].count += 1;
  }
  return out;
}

/**
 * Répartition des ventes par jour de la semaine (Lundi = 0).
 */
export async function salesByDayOfWeek(): Promise<{ day: string; sales: number; revenue: number }[]> {
  const sales = await prisma.sale.findMany({
    select: { soldAt: true, soldPrice: true },
  });
  const labels = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  const out = labels.map((day) => ({ day, sales: 0, revenue: 0 }));
  for (const s of sales) {
    const jsDay = new Date(s.soldAt).getDay(); // 0=Dim, 1=Lun…
    const idx = (jsDay + 6) % 7; // Lun=0
    out[idx].sales += 1;
    out[idx].revenue += s.soldPrice;
  }
  return out.map((d) => ({ ...d, revenue: round2(d.revenue) }));
}

/**
 * Top marques (revenue, profit, multiplicateur moyen, nb ventes).
 */
export async function topBrands(limit: number = 10): Promise<{
  brand: string;
  sales: number;
  revenue: number;
  profit: number;
  avgMultiplier: number;
}[]> {
  const sales = await prisma.sale.findMany({
    select: {
      soldPrice: true,
      netProfit: true,
      item: { select: { brand: true, purchasePrice: true } },
    },
  });
  const map = new Map<string, { sales: number; revenue: number; profit: number; multSum: number; multCount: number }>();
  for (const s of sales) {
    const b = (s.item.brand && s.item.brand.trim()) || "Sans marque";
    const bucket = map.get(b) ?? { sales: 0, revenue: 0, profit: 0, multSum: 0, multCount: 0 };
    bucket.sales += 1;
    bucket.revenue += s.soldPrice;
    bucket.profit += s.netProfit;
    if (s.item.purchasePrice > 0) {
      bucket.multSum += s.soldPrice / s.item.purchasePrice - 1;
      bucket.multCount += 1;
    }
    map.set(b, bucket);
  }
  return Array.from(map.entries())
    .map(([brand, v]) => ({
      brand,
      sales: v.sales,
      revenue: round2(v.revenue),
      profit: round2(v.profit),
      avgMultiplier: v.multCount > 0 ? v.multSum / v.multCount : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

/**
 * Aging stock : articles encore en LISTED dont la dernière mise en ligne
 * date de plus de `days` jours.
 */
export async function agingStock(days: number = 60) {
  const threshold = new Date(Date.now() - days * 86400000);
  return prisma.item.findMany({
    where: {
      status: "LISTED",
      listedAt: { lt: threshold },
    },
    orderBy: { listedAt: "asc" },
    select: {
      id: true,
      title: true,
      brand: true,
      category: true,
      subcategory: true,
      purchasePrice: true,
      listingPrice: true,
      listedAt: true,
      user: { select: { name: true, email: true } },
    },
    take: 30,
  });
}

/**
 * Métriques globales avancées :
 * - sellThrough : % articles déjà vendus / (vendus + encore en stock listés)
 * - avgDaysToSell : moyenne createdAt → soldAt
 * - avgDaysToList : moyenne createdAt → listedAt
 */
export async function advancedKpis() {
  const [soldCount, totalListedOrStock, allSales, listedItems] = await Promise.all([
    prisma.item.count({ where: { status: "SOLD" } }),
    prisma.item.count({ where: { status: { in: ["SOLD", "LISTED", "IN_STOCK"] } } }),
    prisma.sale.findMany({
      select: { soldAt: true, item: { select: { createdAt: true } } },
    }),
    prisma.item.findMany({
      where: { listedAt: { not: null } },
      select: { createdAt: true, listedAt: true },
    }),
  ]);

  const sellThrough = totalListedOrStock > 0 ? soldCount / totalListedOrStock : 0;

  let daysToSellSum = 0;
  let daysToSellCount = 0;
  for (const s of allSales) {
    if (!s.item.createdAt) continue;
    const d = (new Date(s.soldAt).getTime() - new Date(s.item.createdAt).getTime()) / 86400000;
    if (d >= 0) {
      daysToSellSum += d;
      daysToSellCount += 1;
    }
  }
  const avgDaysToSell = daysToSellCount > 0 ? daysToSellSum / daysToSellCount : null;

  let daysToListSum = 0;
  let daysToListCount = 0;
  for (const i of listedItems) {
    if (!i.listedAt) continue;
    const d = (new Date(i.listedAt).getTime() - new Date(i.createdAt).getTime()) / 86400000;
    if (d >= 0) {
      daysToListSum += d;
      daysToListCount += 1;
    }
  }
  const avgDaysToList = daysToListCount > 0 ? daysToListSum / daysToListCount : null;

  return { sellThrough, avgDaysToSell, avgDaysToList };
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
