import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/PageHeader";
import { KpiCard } from "@/components/KpiCard";
import { ProgressRing } from "@/components/ProgressRing";
import { Sparkline } from "@/components/Sparkline";
import { eur, dateFr } from "@/lib/format";
import { dailyRevenue } from "@/lib/finance";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const since30 = new Date(Date.now() - 30 * 24 * 3600 * 1000);

  const [
    resellerCount,
    itemsInStock,
    itemsListed,
    sales30,
    salesAll,
    pendingPayouts,
    recentSales,
    daily,
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
    prisma.sale.aggregate({
      where: { paymentStatus: "PENDING" },
      _sum: { resellerPayout: true },
    }),
    prisma.sale.findMany({
      take: 8,
      orderBy: { soldAt: "desc" },
      include: { item: true, reseller: true },
    }),
    dailyRevenue(30),
  ]);

  const totalItems = itemsInStock + itemsListed;
  const listedRatio = totalItems > 0 ? itemsListed / totalItems : 0;

  const revenueSpark = daily.map((d) => d.revenue);
  const profitSpark = daily.map((d) => d.profit);
  const salesSpark = daily.map((d) => d.sales);

  return (
    <>
      <PageHeader
        title="Cockpit"
        subtitle="Vue d'ensemble de ton réseau"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard
          label="Revendeurs actifs"
          animateValue={resellerCount}
          delay={0}
        />
        <KpiCard
          label="Articles en stock"
          animateValue={totalItems}
          hint={`${itemsListed} en ligne · ${itemsInStock} non listés`}
          delay={60}
        />
        <KpiCard
          label="CA 30 jours"
          animateValue={sales30._sum.soldPrice ?? 0}
          format="eur"
          hint={`${sales30._count} ventes`}
          tone="positive"
          spark={revenueSpark}
          delay={120}
        />
        <KpiCard
          label="Profit net 30 j"
          animateValue={sales30._sum.netProfit ?? 0}
          format="eur"
          tone="positive"
          spark={profitSpark}
          delay={180}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <KpiCard
          label="CA cumulé total"
          animateValue={salesAll._sum.soldPrice ?? 0}
          format="eur"
          hint={`${salesAll._count} ventes au total`}
          delay={220}
        />
        <KpiCard
          label="Profit net total"
          animateValue={salesAll._sum.netProfit ?? 0}
          format="eur"
          spark={salesSpark}
          delay={280}
        />
        <KpiCard
          label="À verser aux revendeurs"
          animateValue={pendingPayouts._sum.resellerPayout ?? 0}
          format="eur"
          tone="warning"
          delay={340}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="rounded-xl border border-subtle bg-surface p-6 flex items-center gap-5 card-hover animate-fade-in" style={{ animationDelay: "380ms" }}>
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

        <div className="lg:col-span-2 rounded-xl border border-subtle bg-surface p-6 card-hover animate-fade-in" style={{ animationDelay: "440ms" }}>
          <div className="text-sm text-muted mb-1">Activité 30 jours</div>
          <div className="text-2xl font-semibold mb-3">{sales30._count} ventes</div>
          <Sparkline data={salesSpark} height={80} />
        </div>
      </div>

      <section className="rounded-xl border border-subtle bg-surface animate-fade-in" style={{ animationDelay: "500ms" }}>
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
                <th className="px-4 py-2 text-right">Profit net</th>
              </tr>
            </thead>
            <tbody>
              {recentSales.map((s) => (
                <tr key={s.id} className="border-t border-subtle/60 hover:bg-surface-2 transition-colors">
                  <td className="px-4 py-2">{dateFr(s.soldAt)}</td>
                  <td className="px-4 py-2 font-medium">{s.item.title}</td>
                  <td className="px-4 py-2 text-muted">{s.reseller.name ?? s.reseller.email}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{eur(s.soldPrice)}</td>
                  <td className="px-4 py-2 text-right tabular-nums font-medium">{eur(s.netProfit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}

