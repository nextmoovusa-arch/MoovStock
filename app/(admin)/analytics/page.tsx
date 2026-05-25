import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/PageHeader";
import { KpiCard } from "@/components/KpiCard";
import { eur } from "@/lib/format";
import {
  monthlyRevenueProfit,
  topCategories,
  revenueByReseller,
} from "@/lib/finance";
import { prisma } from "@/lib/prisma";
import { RevenueProfitChart } from "./RevenueProfitChart";
import { CategoryPie } from "./CategoryPie";
import { ResellerBarChart } from "./ResellerBarChart";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  await requireAdmin();

  const [monthly, cats, byReseller, allTime] = await Promise.all([
    monthlyRevenueProfit(12),
    topCategories(8),
    revenueByReseller(),
    prisma.sale.aggregate({
      _sum: { soldPrice: true, netProfit: true, grossProfit: true },
      _count: true,
    }),
  ]);

  const avgBasket =
    allTime._count > 0 ? (allTime._sum.soldPrice ?? 0) / allTime._count : 0;
  const marginPct =
    (allTime._sum.soldPrice ?? 0) > 0
      ? ((allTime._sum.grossProfit ?? 0) / (allTime._sum.soldPrice ?? 1)) * 100
      : 0;

  return (
    <>
      <PageHeader
        title="Analytics"
        subtitle="Tendances de ton réseau sur les 12 derniers mois."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="CA cumulé" value={eur(allTime._sum.soldPrice)} hint={`${allTime._count} ventes`} />
        <KpiCard label="Profit net cumulé" value={eur(allTime._sum.netProfit)} tone="positive" />
        <KpiCard label="Panier moyen" value={eur(avgBasket)} />
        <KpiCard label="Marge brute" value={`${marginPct.toFixed(1)} %`} tone="positive" />
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-6 mb-6">
        <h2 className="font-medium mb-4">CA & profit net mensuel</h2>
        <RevenueProfitChart data={monthly} />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="font-medium mb-4">Top catégories (CA)</h2>
          <CategoryPie data={cats} />
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="font-medium mb-4">CA par revendeur</h2>
          <ResellerBarChart data={byReseller} />
        </section>
      </div>
    </>
  );
}
