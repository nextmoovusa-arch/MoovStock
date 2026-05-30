import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/PageHeader";
import { KpiCard } from "@/components/KpiCard";
import { ProgressRing } from "@/components/ProgressRing";
import { eur, dateFr } from "@/lib/format";
import {
  dailyRevenue,
  monthlyRevenueProfit,
  monthlyProfitWithCosts,
  averageMultiplier,
  cashByAccount,
  pendingPayoutsByReseller,
} from "@/lib/finance";
import Link from "next/link";
import { RevenueOnlyChart } from "./RevenueOnlyChart";
import { ProfitCostsChart } from "./ProfitCostsChart";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const since30 = new Date(Date.now() - 30 * 24 * 3600 * 1000);

  const [
    resellerCount,
    itemsInStock,
    itemsListed,
    sales30,
    salesAll,
    recentSales,
    daily,
    monthly,
    profitCosts,
    multi,
    accounts,
    debts,
    stockCost30,
    suppliesCost30,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "RESELLER", active: true } }),
    prisma.item.count({ where: { status: "IN_STOCK" } }),
    prisma.item.count({ where: { status: "LISTED" } }),
    prisma.sale.aggregate({
      where: { soldAt: { gte: since30 } },
      _sum: { soldPrice: true, netProfit: true, grossProfit: true },
      _count: true,
    }),
    prisma.sale.aggregate({
      _sum: { soldPrice: true, netProfit: true },
      _count: true,
    }),
    prisma.sale.findMany({
      take: 8,
      orderBy: { soldAt: "desc" },
      include: { item: true, reseller: true },
    }),
    dailyRevenue(30),
    monthlyRevenueProfit(12),
    monthlyProfitWithCosts(12),
    averageMultiplier(),
    cashByAccount(),
    pendingPayoutsByReseller(),
    prisma.transaction.aggregate({
      where: { category: "STOCK_BUY", date: { gte: since30 } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { category: "SUPPLIES", date: { gte: since30 } },
      _sum: { amount: true },
    }),
  ]);

  const totalItems = itemsInStock + itemsListed;
  const listedRatio = totalItems > 0 ? itemsListed / totalItems : 0;

  // Trésorerie : uniquement le compte bancaire
  const bankBalance = accounts.find((a) => a.account === "BANK")?.balance ?? 0;
  const totalDebts = debts.reduce((s, d) => s + d.amount, 0);
  const cashReel = bankBalance - totalDebts;

  // Marges et ratios
  const marginPct =
    sales30._sum.soldPrice && sales30._sum.soldPrice > 0
      ? ((sales30._sum.grossProfit ?? 0) / sales30._sum.soldPrice) * 100
      : 0;
  const avgBasket =
    (sales30._count ?? 0) > 0 ? (sales30._sum.soldPrice ?? 0) / sales30._count : 0;

  const revenueSpark = daily.map((d) => d.revenue);
  const profitSpark = daily.map((d) => d.profit);

  return (
    <>
      <PageHeader
        title="Cockpit"
        subtitle="Vue d'ensemble de ton réseau"
      />

      {/* Ligne 1 : KPIs principaux (CA, profit, multiplicateur, cash réel) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="CA 30 jours"
          animateValue={sales30._sum.soldPrice ?? 0}
          format="eur"
          hint={`${sales30._count} ventes`}
          tone="positive"
          spark={revenueSpark}
          delay={0}
        />
        <KpiCard
          label="Profit net 30 j"
          animateValue={sales30._sum.netProfit ?? 0}
          format="eur"
          hint={`marge ${marginPct.toFixed(1)} %`}
          tone="positive"
          spark={profitSpark}
          delay={60}
        />
        <KpiCard
          label="Multiplicateur moyen"
          value={multi.multiplier > 1 ? `×${(multi.multiplier - 1).toFixed(2)}` : "—"}
          hint={
            multi.sales > 0
              ? `${eur(multi.totalPurchase)} → ${eur(multi.totalSold)}`
              : "aucune vente"
          }
          tone="positive"
          delay={120}
        />
        <KpiCard
          label="Compte bancaire"
          animateValue={bankBalance}
          format="eur"
          hint={
            totalDebts > 0
              ? `cash réel ${eur(cashReel)} après dettes`
              : "tout est à jour"
          }
          tone={bankBalance >= 0 ? "default" : "negative"}
          delay={180}
        />
      </div>

      {/* Ligne 2 : KPIs analyse coûts + activité */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard
          label="Panier moyen 30 j"
          animateValue={avgBasket}
          format="eur"
          delay={220}
        />
        <KpiCard
          label="Achats stock 30 j"
          animateValue={stockCost30._sum.amount ?? 0}
          format="eur"
          tone="negative"
          delay={260}
        />
        <KpiCard
          label="Consommables 30 j"
          animateValue={suppliesCost30._sum.amount ?? 0}
          format="eur"
          tone="warning"
          delay={300}
        />
        <KpiCard
          label="Profit net total"
          animateValue={salesAll._sum.netProfit ?? 0}
          format="eur"
          hint={`${salesAll._count} ventes au total`}
          delay={340}
        />
      </div>

      {/* Graphiques séparés */}
      <section className="rounded-xl border border-subtle bg-surface p-6 mb-6 animate-fade-in" style={{ animationDelay: "380ms" }}>
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="font-medium">Chiffre d&apos;affaires · 12 derniers mois</h2>
          <span className="text-xs text-muted">Mensuel</span>
        </div>
        <RevenueOnlyChart data={monthly.map((m) => ({ label: m.label, revenue: m.revenue }))} />
      </section>

      <section className="rounded-xl border border-subtle bg-surface p-6 mb-8 animate-fade-in" style={{ animationDelay: "420ms" }}>
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="font-medium">Profit net & coûts · 12 derniers mois</h2>
          <span className="text-xs text-muted">Achats vêtements + consommables empilés · profit en ligne</span>
        </div>
        <ProfitCostsChart data={profitCosts} />
      </section>

      {/* Couverture marketplace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="rounded-xl border border-subtle bg-surface p-6 flex items-center gap-5 card-hover animate-fade-in" style={{ animationDelay: "460ms" }}>
          <ProgressRing
            value={itemsListed}
            max={Math.max(totalItems, 1)}
            tone="accent"
            label={`${Math.round(listedRatio * 100)}%`}
            sub="en ligne"
          />
          <div>
            <div className="text-sm text-muted">Couverture marketplace</div>
            <div className="font-medium mt-1">
              {itemsListed} sur {totalItems} articles listés
            </div>
            <div className="text-xs text-muted mt-2">
              Plus tu listes vite, plus tu vends. Objectif : 90%+.
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-subtle bg-surface p-6 card-hover animate-fade-in" style={{ animationDelay: "500ms" }}>
          <div className="text-xs uppercase tracking-wider text-muted">Revendeurs actifs</div>
          <div className="text-3xl font-semibold mt-2 tabular-nums">{resellerCount}</div>
          <Link href="/resellers" className="text-xs text-accent hover:underline mt-3 inline-block">
            Gérer →
          </Link>
        </div>

        <div className="rounded-xl border border-subtle bg-surface p-6 card-hover animate-fade-in" style={{ animationDelay: "540ms" }}>
          <div className="text-xs uppercase tracking-wider text-muted">Dettes revendeurs</div>
          <div
            className={`text-3xl font-semibold mt-2 tabular-nums ${
              totalDebts > 0 ? "text-warning" : ""
            }`}
          >
            {eur(totalDebts)}
          </div>
          <Link href="/finance/debts" className="text-xs text-accent hover:underline mt-3 inline-block">
            {totalDebts > 0 ? "Payer →" : "Voir →"}
          </Link>
        </div>
      </div>

      {/* Dernières ventes */}
      <section className="rounded-xl border border-subtle bg-surface animate-fade-in" style={{ animationDelay: "580ms" }}>
        <div className="px-4 py-3 border-b border-subtle flex justify-between items-center">
          <h2 className="font-medium">Dernières ventes</h2>
          <Link href="/finance" className="text-sm text-muted hover:text-foreground">
            Voir tout →
          </Link>
        </div>
        {recentSales.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted">
            Aucune vente enregistrée. Les revendeurs marqueront leurs articles comme vendus.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-muted bg-surface-2">
              <tr>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Article</th>
                <th className="px-4 py-2">Revendeur</th>
                <th className="px-4 py-2 text-right">Prix</th>
                <th className="px-4 py-2 text-right">Multipl.</th>
                <th className="px-4 py-2 text-right">Profit net</th>
              </tr>
            </thead>
            <tbody>
              {recentSales.map((s) => {
                const mult =
                  s.item.purchasePrice > 0 ? s.soldPrice / s.item.purchasePrice : 0;
                return (
                  <tr key={s.id} className="border-t border-subtle/60 hover:bg-surface-2 transition-colors">
                    <td className="px-4 py-2">{dateFr(s.soldAt)}</td>
                    <td className="px-4 py-2 font-medium">{s.item.title}</td>
                    <td className="px-4 py-2 text-muted">{s.reseller.name ?? s.reseller.email}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{eur(s.soldPrice)}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-success">
                      {mult > 1 ? `×${(mult - 1).toFixed(2)}` : "—"}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums font-medium">{eur(s.netProfit)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
