import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/PageHeader";
import { KpiCard } from "@/components/KpiCard";
import { PaymentStatusBadge } from "@/components/StatusBadge";
import { eur, dateFr } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function MySalesPage() {
  const user = await requireUser();

  const sales = await prisma.sale.findMany({
    where: { resellerId: user.id },
    orderBy: { soldAt: "desc" },
    include: { item: true },
  });

  const totalRevenue = sales.reduce((s, x) => s + x.soldPrice, 0);
  const totalGross = sales.reduce((s, x) => s + x.grossProfit, 0);
  const totalPayout = sales.reduce((s, x) => s + x.resellerPayout, 0);
  const owed = sales.filter((s) => s.paymentStatus === "PENDING").reduce((s, x) => s + x.resellerPayout, 0);

  return (
    <>
      <PageHeader
        title="Mes ventes"
        subtitle={`${sales.length} ventes au total`}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Chiffre d'affaires" value={eur(totalRevenue)} />
        <KpiCard label="Bénéfice brut" value={eur(totalGross)} tone="positive" />
        <KpiCard label="Ma commission totale" value={eur(totalPayout)} tone="positive" />
        <KpiCard label="À recevoir" value={eur(owed)} tone="warning" />
      </div>

      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-slate-500 bg-slate-50">
            <tr>
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Article</th>
              <th className="px-4 py-2 text-right">Prix</th>
              <th className="px-4 py-2 text-right">Profit brut</th>
              <th className="px-4 py-2 text-right">Ma commission</th>
              <th className="px-4 py-2">Paiement</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((s) => (
              <tr key={s.id} className="border-t border-slate-100">
                <td className="px-4 py-3">{dateFr(s.soldAt)}</td>
                <td className="px-4 py-3 font-medium">{s.item.title}</td>
                <td className="px-4 py-3 text-right tabular-nums">{eur(s.soldPrice)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{eur(s.grossProfit)}</td>
                <td className="px-4 py-3 text-right tabular-nums font-medium">{eur(s.resellerPayout)}</td>
                <td className="px-4 py-3"><PaymentStatusBadge status={s.paymentStatus} /></td>
              </tr>
            ))}
            {sales.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                  Aucune vente pour l&apos;instant.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
