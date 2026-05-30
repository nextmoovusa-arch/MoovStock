import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/PageHeader";
import { KpiCard } from "@/components/KpiCard";
import { eur, dateFr } from "@/lib/format";
import {
  monthlyRevenueProfit,
  topCategories,
  revenueByReseller,
  categoryStats,
  multiplierDistribution,
  daysToSellDistribution,
  salesByDayOfWeek,
  topBrands,
  agingStock,
  advancedKpis,
} from "@/lib/finance";
import { prisma } from "@/lib/prisma";
import { RevenueProfitChart } from "./RevenueProfitChart";
import { CategoryPie } from "./CategoryPie";
import { ResellerBarChart } from "./ResellerBarChart";
import { BarHistogram } from "./BarHistogram";
import { TrendingUp, TrendingDown, Clock, Zap } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  await requireAdmin();

  const [
    monthly,
    cats,
    byReseller,
    allTime,
    perCat,
    multDist,
    daysDist,
    dowDist,
    brands,
    aging,
    advanced,
  ] = await Promise.all([
    monthlyRevenueProfit(12),
    topCategories(8),
    revenueByReseller(),
    prisma.sale.aggregate({
      _sum: { soldPrice: true, netProfit: true, grossProfit: true },
      _count: true,
    }),
    categoryStats(),
    multiplierDistribution(),
    daysToSellDistribution(),
    salesByDayOfWeek(),
    topBrands(10),
    agingStock(60),
    advancedKpis(),
  ]);

  const avgBasket =
    allTime._count > 0 ? (allTime._sum.soldPrice ?? 0) / allTime._count : 0;
  const marginPct =
    (allTime._sum.soldPrice ?? 0) > 0
      ? ((allTime._sum.grossProfit ?? 0) / (allTime._sum.soldPrice ?? 1)) * 100
      : 0;

  // Highlights catégories
  const withSales = perCat.filter((c) => c.sales > 0);
  const topByMultiplier = [...withSales].sort((a, b) => b.avgMultiplier - a.avgMultiplier)[0];
  const worstByMultiplier = [...withSales].sort((a, b) => a.avgMultiplier - b.avgMultiplier)[0];
  const fastest = [...withSales]
    .filter((c) => c.avgDaysToSell !== null)
    .sort((a, b) => (a.avgDaysToSell ?? 0) - (b.avgDaysToSell ?? 0))[0];
  const slowest = [...withSales]
    .filter((c) => c.avgDaysToSell !== null)
    .sort((a, b) => (b.avgDaysToSell ?? 0) - (a.avgDaysToSell ?? 0))[0];

  const sortedTable = [...perCat]
    .sort((a, b) => b.revenue - a.revenue || b.sales - a.sales)
    .slice(0, 15);

  function labelOf(c: { category: string; subcategory: string | null }) {
    return c.subcategory ? `${c.category} › ${c.subcategory}` : c.category;
  }

  function daysAgo(d: Date | null): number {
    if (!d) return 0;
    return Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  }

  return (
    <>
      <PageHeader
        title="Analytics"
        subtitle="Performance détaillée de ton réseau."
      />

      {/* Bloc 1 : 8 KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <KpiCard label="CA cumulé" value={eur(allTime._sum.soldPrice)} hint={`${allTime._count} ventes`} />
        <KpiCard label="Profit net cumulé" value={eur(allTime._sum.netProfit)} tone="positive" />
        <KpiCard label="Panier moyen" value={eur(avgBasket)} />
        <KpiCard label="Marge brute" value={`${marginPct.toFixed(1)} %`} tone="positive" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard
          label="Sell-through"
          value={`${(advanced.sellThrough * 100).toFixed(0)} %`}
          hint="part vendue du stock posté"
          tone={advanced.sellThrough > 0.5 ? "positive" : "warning"}
        />
        <KpiCard
          label="Délai moy. vente"
          value={advanced.avgDaysToSell !== null ? `${advanced.avgDaysToSell.toFixed(0)} j` : "—"}
          hint="ajout → vendu"
        />
        <KpiCard
          label="Délai mise en ligne"
          value={advanced.avgDaysToList !== null ? `${advanced.avgDaysToList.toFixed(1)} j` : "—"}
          hint="ajout → posté"
        />
        <KpiCard
          label="Aging stock"
          value={`${aging.length}`}
          hint={`articles > 60 j en ligne`}
          tone={aging.length > 0 ? "warning" : "default"}
        />
      </div>

      {/* Bloc 2 : CA & profit mensuel */}
      <section className="rounded-xl border border-subtle bg-surface p-6 mb-6">
        <h2 className="font-medium mb-4">CA & profit net mensuel</h2>
        <RevenueProfitChart data={monthly} />
      </section>

      {/* Bloc 3 : Distributions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <section className="rounded-xl border border-subtle bg-surface p-6">
          <h2 className="font-medium mb-1">Distribution du multiplicateur</h2>
          <p className="text-xs text-muted mb-4">Marge réelle par vente (×0.5 = +50 %).</p>
          <BarHistogram data={multDist} color="rgb(63, 212, 179)" />
        </section>
        <section className="rounded-xl border border-subtle bg-surface p-6">
          <h2 className="font-medium mb-1">Délai avant vente</h2>
          <p className="text-xs text-muted mb-4">Du jour d&apos;ajout au jour de vente.</p>
          <BarHistogram data={daysDist} color="rgb(52, 211, 153)" />
        </section>
      </div>

      {/* Bloc 4 : Jour de semaine + Top marques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <section className="rounded-xl border border-subtle bg-surface p-6">
          <h2 className="font-medium mb-1">Ventes par jour de semaine</h2>
          <p className="text-xs text-muted mb-4">Identifie tes meilleurs jours.</p>
          <BarHistogram data={dowDist.map((d) => ({ label: d.day, count: d.sales }))} color="rgb(96, 165, 250)" />
        </section>
        <section className="rounded-xl border border-subtle bg-surface p-6">
          <h2 className="font-medium mb-1">Top 10 marques</h2>
          <p className="text-xs text-muted mb-4">Par CA généré.</p>
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm min-w-[400px]">
              <thead className="text-left text-[10px] uppercase text-muted">
                <tr>
                  <th className="px-2 py-1">Marque</th>
                  <th className="px-2 py-1 text-right">Ventes</th>
                  <th className="px-2 py-1 text-right">CA</th>
                  <th className="px-2 py-1 text-right">×</th>
                </tr>
              </thead>
              <tbody>
                {brands.map((b) => (
                  <tr key={b.brand} className="border-t border-subtle/40">
                    <td className="px-2 py-1.5 font-medium truncate max-w-[140px]">{b.brand}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{b.sales}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{eur(b.revenue)}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums text-success">
                      {b.avgMultiplier > 0 ? `×${b.avgMultiplier.toFixed(2)}` : "—"}
                    </td>
                  </tr>
                ))}
                {brands.length === 0 && (
                  <tr><td colSpan={4} className="px-2 py-4 text-center text-muted text-xs">Pas de marques.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Bloc 5 : Pie + Reseller */}
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

      {/* Bloc 6 : Performance par catégorie */}
      <section className="rounded-xl border border-subtle bg-surface p-6 mb-6 animate-fade-in">
        <h2 className="font-medium mb-1">Performance par catégorie</h2>
        <p className="text-xs text-muted mb-5">Multiplicateur, vitesse de vente, stock encore disponible.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <HighlightCard
            icon={<TrendingUp className="size-4" />}
            label="Meilleur multipl."
            value={topByMultiplier ? `×${topByMultiplier.avgMultiplier.toFixed(2)}` : "—"}
            sub={topByMultiplier ? labelOf(topByMultiplier) : "aucune vente"}
            tone="success"
          />
          <HighlightCard
            icon={<TrendingDown className="size-4" />}
            label="Pire multipl."
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
                {sortedTable.map((c) => (
                  <tr key={`${c.category}-${c.subcategory ?? ""}`} className="border-t border-subtle/60 hover:bg-surface-2 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium">{c.category}</div>
                      {c.subcategory && <div className="text-xs text-muted">{c.subcategory}</div>}
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
                      Pas encore de données.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Bloc 7 : Aging stock */}
      {aging.length > 0 && (
        <section className="rounded-xl border border-warning/30 bg-warning/5 p-6 mb-6">
          <h2 className="font-medium mb-1">⚠️ Stock dormant (plus de 60 j en ligne)</h2>
          <p className="text-xs text-muted mb-4">Articles à remettre en avant ou rebaisser.</p>
          <div className="rounded-lg border border-subtle overflow-hidden bg-surface">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[680px]">
                <thead className="text-left text-xs uppercase text-muted bg-surface-2">
                  <tr>
                    <th className="px-4 py-2">Article</th>
                    <th className="px-4 py-2">Revendeur</th>
                    <th className="px-4 py-2 text-right">Prix</th>
                    <th className="px-4 py-2 text-right">Posté</th>
                  </tr>
                </thead>
                <tbody>
                  {aging.slice(0, 15).map((it) => (
                    <tr key={it.id} className="border-t border-subtle/60 hover:bg-surface-2 transition-colors">
                      <td className="px-4 py-2">
                        <div className="font-medium">{it.title}</div>
                        <div className="text-xs text-muted">
                          {[it.brand, it.category, it.subcategory].filter(Boolean).join(" · ")}
                        </div>
                      </td>
                      <td className="px-4 py-2 text-muted">{it.user.name ?? it.user.email}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{eur(it.listingPrice)}</td>
                      <td className="px-4 py-2 text-right text-warning tabular-nums">
                        il y a {daysAgo(it.listedAt)} j
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
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
