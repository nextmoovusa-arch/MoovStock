import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/PageHeader";
import { KpiCard } from "@/components/KpiCard";
import { eur, dateFr } from "@/lib/format";
import { pendingPayoutsByReseller } from "@/lib/finance";
import { PayButton } from "./PayButton";

export const dynamic = "force-dynamic";

export default async function DebtsPage() {
  await requireAdmin();

  const debts = await pendingPayoutsByReseller();

  // Détail par revendeur : ventes pending
  const details = await Promise.all(
    debts.map(async (d) => ({
      ...d,
      sales: await prisma.sale.findMany({
        where: { resellerId: d.userId, paymentStatus: "PENDING" },
        orderBy: { soldAt: "desc" },
        include: { item: { select: { title: true } } },
      }),
    })),
  );

  const total = debts.reduce((s, d) => s + d.amount, 0);

  return (
    <>
      <PageHeader
        title="Dettes envers tes revendeurs"
        subtitle="Marque-les comme payés ; une transaction RESELLER_PAYOUT est créée automatiquement."
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <KpiCard label="Total dû" value={eur(total)} tone={total > 0 ? "warning" : "default"} />
        <KpiCard label="Revendeurs concernés" value={String(debts.length)} />
        <KpiCard
          label="Ventes en attente"
          value={String(debts.reduce((s, d) => s + d.pendingSalesCount, 0))}
        />
      </div>

      {details.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          Toutes les ventes ont été payées ✓
        </div>
      ) : (
        <div className="space-y-4">
          {details.map((d) => (
            <section key={d.userId} className="rounded-lg border border-slate-200 bg-white overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <Link
                    href={`/resellers/${d.userId}`}
                    className="font-medium hover:underline"
                  >
                    {d.name ?? d.email}
                  </Link>
                  <div className="text-xs text-slate-500">
                    {d.pendingSalesCount} vente(s) en attente
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-xs text-slate-500">À payer</div>
                    <div className="text-xl font-semibold tabular-nums text-amber-700">
                      {eur(d.amount)}
                    </div>
                  </div>
                  <PayButton resellerId={d.userId} amount={d.amount} />
                </div>
              </div>

              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase text-slate-500 bg-slate-50">
                  <tr>
                    <th className="px-4 py-2">Vendu le</th>
                    <th className="px-4 py-2">Article</th>
                    <th className="px-4 py-2 text-right">Prix</th>
                    <th className="px-4 py-2 text-right">Sa commission</th>
                  </tr>
                </thead>
                <tbody>
                  {d.sales.map((s) => (
                    <tr key={s.id} className="border-t border-slate-100">
                      <td className="px-4 py-2 text-slate-600">{dateFr(s.soldAt)}</td>
                      <td className="px-4 py-2">{s.item.title}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{eur(s.soldPrice)}</td>
                      <td className="px-4 py-2 text-right tabular-nums font-medium">{eur(s.resellerPayout)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
