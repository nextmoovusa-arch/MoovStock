import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/PageHeader";
import { KpiCard } from "@/components/KpiCard";
import { eur } from "@/lib/format";
import {
  monthlyRevenueProfit,
  topCategories,
  revenueByReseller,
  categoryStats,
} from "@/lib/finance";
import { prisma } from "@/lib/prisma";
import { RevenueProfitChart } from "./RevenueProfitChart";
import { CategoryPie } from "./CategoryPie";
import { ResellerBarChart } from "./ResellerBarChart";
import { TrendingUp, TrendingDown, Clock, Zap } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  await requireAdmin();

  const [monthly, cats, byReseller, allTime, perCat] = await Promise.all([
    monthlyRevenueProfit(12),
    topCategories(8),
    revenueByReseller(),
    prisma.sale.aggregate({
      _sum: { soldPrice: true, netProfit: true, grossProfit: true },
      _count: true,
    }),
    categoryStats(),
  ]);

  const avgBasket =
    allTime._count > 0 ? (allTime._sum.soldPrice ?? 0) / allTime._count : 0;
  const marginPct =
    (allTime._sum.soldPrice ?? 0) > 0
      ? ((allTime._sum.grossProfit ?? 0) / (allTime._sum.soldPrice ?? 1)) * 100
      : 0;

  // Tri pour faire ressortir les meilleures / pires catégories
  const withSales = perCat.filter((c) => c.sales > 0);
  const topByMultiplier = [...withSales]
    .sort((a, b) => b.avgMultiplier - a.avgMultiplier)
    .slice(0, 1)[0];
  const worstByMultiplier = [...withSales]
    .sort((a, b) => a.avgMultiplier - b.avgMultiplier)
    .slice(0, 1)[0];
  const fastest = [...withSales]
    .filter((c) => c.avgDaysToSell !== null)
    .sort((a, b) => (a.avgDaysToSell ?? 0) - (b.avgDaysToSell ?? 0))
    .slice(0, 1)[0];
  const slowest = [...withSales]
    .filter((c) => c.avgDaysToSell !== null)
    .sort((a, b) => (b.avgDaysToSell ?? 0) - (a.avgDaysToSell ?? 0))
    .slice(0, 1)[0];

  // Tableau de performance (top 15 par CA)
  const sortedTable = [...perCat]
    .sort((a, b) => b.revenue - a.revenue || b.sales - a.sales)
    .slice(0, 15);

  function labelOf(c: { category: string; subcategory: string | null }) {
    return c.subcategory ? `${c.category} › ${c.subcategory}` : c.category;
  }

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

      <section className="rounded-xl border border-subtle bg-surface p-6 mb-6">
        <h2 className="font-medium mb-4">CA & profit net mensuel</h2>
        <RevenueProfitChart data={monthly} />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <section className="rounded-xl border border-subtle bg-surface p-6">
          <h2 className="font-medium mb-4">Top catégories (CA)</h2>
          <CategoryPie data={cats} />
        </section>

        <section className="rounded-xl border border-subtle bg-surface p-6">
          <h2 className="font-medium mb-4">CA par revendeur</h2>
          <ResellerBarChart data={byReseller} />
        </section>
      </div>

      {/* Performance par catégorie */}
      <section className="rounded-xl border border-subtle bg-surface p-6 mb-6 animate-fade-in">
        <h2 className="font-medium mb-1">Performance par catégorie</h2>
        <p className="text-xs text-muted mb-5">
          Multiplicateur, vitesse de vente, stock encore disponible.
        </p>

        {/* Faits saillants */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <HighlightCard
            icon={<TrendingUp className="size-4" />}
            label="Meilleur multiplicateur"
            value={topByMultiplier ? `×${topByMultiplier.avgMultiplier.toFixed(2)}` : "—"}
            sub={topByMultiplier ? labelOf(topByMultiplier) : "aucune vente"}
            tone="success"
          />
          <HighlightCard
            icon={<TrendingDown className="size-4" />}
            label="Pire multiplicateur"
            value={worstByMultiplier ? `×${worstByMultiplier.avgMultiplier.toFixed(2)}` : "—"}
            sub={worstByMultiplier ? labelOf(worstByMultiplier) : "aucune vente"}
            tone="danger"
          />
          <HighlightCard
            icon={<Zap className="size-4" />}
            label="Plus vite vendu"
            value={fastest && fastest.avgDaysToSell !== null ? `${fastest.avgDaysToSell.toFixed(0)} j` : "—"}
            sub={fastest ? labelOf(fastest) : "aucune vente"}
            tone="success"
          />
          <HighlightCard
            icon={<Clock className="size-4" />}
            label="Plus long à vendre"
            value={slowest && slowest.avgDaysToSell !== null ? `${slowest.avgDaysToSell.toFixed(0)} j` : "—"}
            sub={slowest ? labelOf(slowest) : "aucune vente"}
            tone="warning"
          />
        </div>

        {/* Tableau détaillé */}
        <div className="rounded-lg border border-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead className="text-left text-xs uppercase text-muted bg-surface-2">
                <tr>
                  <th className="px-4 py-2">Catégorie</th>
                  <th className="px-4 py-2 text-right">Ventes</th>
                  <th className="px-4 py-2 text-right">CA</th>
                  <th className="px-4 py-2 text-right">Profit</th>
                  <th className="px-4 py-2 text-right">Multipl. moyen</th>
                  <th className="px-4 py-2 text-right">Délai moyen</th>
                  <th className="px-4 py-2 text-right">En stock</th>
                </tr>
              </thead>
              <tbody>
                {sortedTable.map((c, i) => (
                  <tr key={`${c.category}-${c.subcategory ?? ""}`} className="border-t border-subtle/60 hover:bg-surface-2 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium">{c.category}</div>
                      {c.subcategory && (
                        <div className="text-xs text-muted">{c.subcategory}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{c.sales}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{eur(c.revenue)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-success">{eur(c.profit)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {c.avgMultiplier > 0 ? `×${c.avgMultiplier.toFixed(2)}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {c.avgDaysToSell !== null ? `${c.avgDaysToSell.toFixed(0)} j` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted">
                      {c.stockListed > 0 ? c.stockListed : "—"}
                    </td>
                  </tr>
                ))}
                {sortedTable.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted">
                      Pas encore de données par catégorie.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </>
  );
}

function HighlightCard({
  icon, label, value, sub, tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  tone: "success" | "danger" | "warning";
}) {
  const toneCls =
    tone === "success" ? "text-success bg-success/10 border-success/30" :
    tone === "danger"  ? "text-danger bg-danger/10 border-danger/30" :
                          "text-warning bg-warning/10 border-warning/30";
  return (
    <div className="rounded-lg border border-subtle bg-surface-2 p-3">
      <div className="flex items-center gap-2 mb-2">
        <span className={`inline-flex items-center justify-center size-6 rounded-md border ${toneCls}`}>
          {icon}
        </span>
        <span className="text-xs uppercase tracking-wider text-muted">{label}</span>
      </div>
      <div className="text-xl font-semibold tabular-nums">{value}</div>
      <div className="text-xs text-muted truncate mt-0.5">{sub}</div>
    </div>
  );
}
