import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/PageHeader";
import { KpiCard } from "@/components/KpiCard";
import { eur, dateFr } from "@/lib/format";
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
  ]);

  return (
    <>
      <PageHeader
        title="Cockpit"
        subtitle="Vue d'ensemble de ton réseau"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Revendeurs actifs" value={String(resellerCount)} />
        <KpiCard
          label="Articles en stock"
          value={String(itemsInStock + itemsListed)}
          hint={`${itemsListed} en ligne · ${itemsInStock} non listés`}
        />
        <KpiCard
          label="CA 30 jours"
          value={eur(sales30._sum.soldPrice)}
          hint={`${sales30._count} ventes`}
          tone="positive"
        />
        <KpiCard
          label="Profit net 30 j"
          value={eur(sales30._sum.netProfit)}
          tone="positive"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <KpiCard
          label="CA cumulé total"
          value={eur(salesAll._sum.soldPrice)}
          hint={`${salesAll._count} ventes au total`}
        />
        <KpiCard
          label="Profit net total"
          value={eur(salesAll._sum.netProfit)}
        />
        <KpiCard
          label="À verser aux revendeurs"
          value={eur(pendingPayouts._sum.resellerPayout)}
          tone="warning"
        />
      </div>

      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="px-4 py-3 border-b border-slate-200 flex justify-between items-center">
          <h2 className="font-medium">Dernières ventes</h2>
          <Link href="/finance" className="text-sm text-slate-500 hover:text-slate-900">
            Voir tout →
          </Link>
        </div>
        {recentSales.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            Aucune vente enregistrée. Les revendeurs marqueront leurs articles comme vendus.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-slate-500 bg-slate-50">
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
                <tr key={s.id} className="border-t border-slate-100">
                  <td className="px-4 py-2">{dateFr(s.soldAt)}</td>
                  <td className="px-4 py-2 font-medium">{s.item.title}</td>
                  <td className="px-4 py-2 text-slate-600">{s.reseller.name ?? s.reseller.email}</td>
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
