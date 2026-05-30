import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/PageHeader";
import { KpiCard } from "@/components/KpiCard";
import { PaymentStatusBadge } from "@/components/StatusBadge";
import { eur, dateFr } from "@/lib/format";

export const dynamic = "force-dynamic";

type Range = "week" | "month30" | "month_calendar" | "year" | "all";

const RANGES: { v: Range; label: string }[] = [
  { v: "week", label: "Cette semaine" },
  { v: "month30", label: "30 derniers jours" },
  { v: "month_calendar", label: "Ce mois" },
  { v: "year", label: "Cette année" },
  { v: "all", label: "Tout" },
];

function startOfRange(range: Range): Date | null {
  const now = new Date();
  switch (range) {
    case "week": {
      const d = new Date(now);
      // Lundi = 1
      const day = (d.getDay() + 6) % 7; // 0 = lundi
      d.setDate(d.getDate() - day);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case "month30":
      return new Date(now.getTime() - 30 * 86400000);
    case "month_calendar":
      return new Date(now.getFullYear(), now.getMonth(), 1);
    case "year":
      return new Date(now.getFullYear(), 0, 1);
    case "all":
      return null;
  }
}

export default async function MySalesPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const range: Range =
    (RANGES.find((r) => r.v === params.range)?.v as Range) ?? "month30";
  const since = startOfRange(range);

  const sales = await prisma.sale.findMany({
    where: {
      resellerId: user.id,
      ...(since ? { soldAt: { gte: since } } : {}),
    },
    orderBy: { soldAt: "desc" },
    include: { item: true },
  });

  const totalRevenue = sales.reduce((s, x) => s + x.soldPrice, 0);
  const totalGross = sales.reduce((s, x) => s + x.grossProfit, 0);
  const totalPayout = sales.reduce((s, x) => s + x.resellerPayout, 0);
  const owed = sales
    .filter((s) => s.paymentStatus === "PENDING")
    .reduce((s, x) => s + x.resellerPayout, 0);
  const avgBasket = sales.length > 0 ? totalRevenue / sales.length : 0;

  return (
    <>
      <PageHeader
        title="Mes ventes"
        subtitle={`${sales.length} ventes sur la période sélectionnée`}
      />

      {/* Tabs filtres temporels */}
      <div className="inline-flex flex-wrap rounded-lg border border-subtle bg-surface p-1 mb-5">
        {RANGES.map((r) => {
          const active = r.v === range;
          return (
            <Link
              key={r.v}
              href={`/my/sales?range=${r.v}`}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                active ? "bg-accent-soft text-accent" : "text-muted hover:text-foreground"
              }`}
            >
              {r.label}
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <KpiCard
          label="Chiffre d'affaires"
          animateValue={totalRevenue}
          format="eur"
          delay={0}
        />
        <KpiCard
          label="Bénéfice brut"
          animateValue={totalGross}
          format="eur"
          tone="positive"
          delay={60}
        />
        <KpiCard
          label="Ma commission"
          animateValue={totalPayout}
          format="eur"
          tone="positive"
          delay={120}
        />
        <KpiCard
          label="À recevoir"
          animateValue={owed}
          format="eur"
          tone="warning"
          delay={180}
        />
        <KpiCard
          label="Panier moyen"
          animateValue={avgBasket}
          format="eur"
          delay={220}
        />
      </div>

      <div className="rounded-xl border border-subtle bg-surface overflow-hidden animate-fade-in">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-muted bg-surface-2">
            <tr>
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Article</th>
              <th className="px-4 py-2 text-right">Prix vendu</th>
              <th className="px-4 py-2 text-right">Profit brut</th>
              <th className="px-4 py-2 text-right">Ma commission</th>
              <th className="px-4 py-2">Paiement</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((s) => (
              <tr key={s.id} className="border-t border-subtle/60 hover:bg-surface-2 transition-colors">
                <td className="px-4 py-3">{dateFr(s.soldAt)}</td>
                <td className="px-4 py-3">
                  <div className="font-medium">{s.item.title}</div>
                  {s.item.category && (
                    <div className="text-xs text-muted">{s.item.category}</div>
                  )}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{eur(s.soldPrice)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{eur(s.grossProfit)}</td>
                <td className="px-4 py-3 text-right tabular-nums font-medium">{eur(s.resellerPayout)}</td>
                <td className="px-4 py-3"><PaymentStatusBadge status={s.paymentStatus} /></td>
              </tr>
            ))}
            {sales.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted">
                  Aucune vente sur cette période.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
