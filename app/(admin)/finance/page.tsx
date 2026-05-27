import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/PageHeader";
import { KpiCard } from "@/components/KpiCard";
import { eur, dateFr } from "@/lib/format";
import { cashByAccount, pendingPayoutsByReseller, totalCash } from "@/lib/finance";
import { NewTransactionButton } from "./NewTransactionButton";
import { ACCOUNT_LABEL, CATEGORY_LABEL, TYPE_LABEL } from "./labels";

export const dynamic = "force-dynamic";

export default async function FinancePage() {
  await requireAdmin();

  const [accounts, total, debts, recent, sales30, expenses30] = await Promise.all([
    cashByAccount(),
    totalCash(),
    pendingPayoutsByReseller(),
    prisma.transaction.findMany({
      orderBy: { date: "desc" },
      take: 15,
      include: { relatedUser: true },
    }),
    prisma.sale.aggregate({
      where: { soldAt: { gte: new Date(Date.now() - 30 * 86400000) } },
      _sum: { soldPrice: true, netProfit: true },
    }),
    prisma.transaction.aggregate({
      where: {
        type: { in: ["EXPENSE", "REFUND"] },
        date: { gte: new Date(Date.now() - 30 * 86400000) },
      },
      _sum: { amount: true },
    }),
  ]);

  const totalDebts = debts.reduce((s, d) => s + d.amount, 0);
  const cashRéel = total - totalDebts;

  return (
    <>
      <PageHeader
        title="Trésorerie"
        subtitle="Cash par compte, dépenses, dettes envers tes revendeurs."
        action={<NewTransactionButton />}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Cash total" value={eur(total)} hint="Tous comptes confondus" />
        <KpiCard
          label="Dettes revendeurs"
          value={eur(totalDebts)}
          hint={`${debts.length} revendeur(s)`}
          tone={totalDebts > 0 ? "warning" : "default"}
        />
        <KpiCard
          label="Cash réel dispo"
          value={eur(cashRéel)}
          hint="Après paiement des dettes"
          tone={cashRéel < 0 ? "negative" : "positive"}
        />
        <KpiCard label="Profit net 30 j" value={eur(sales30._sum.netProfit)} tone="positive" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
        {accounts.map((a) => (
          <KpiCard key={a.account} label={ACCOUNT_LABEL[a.account]} value={eur(a.balance)} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 rounded-lg border border-subtle bg-surface overflow-hidden">
          <div className="px-4 py-3 border-b border-subtle flex justify-between items-center">
            <h2 className="font-medium">Dernières transactions</h2>
            <Link href="/finance/transactions" className="text-sm text-muted hover:text-foreground">
              Voir tout →
            </Link>
          </div>
          {recent.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted">
              Aucune transaction.{" "}
              <span className="text-muted-strong">Clique sur « + » pour en ajouter.</span>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-muted bg-surface-2">
                <tr>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Catégorie</th>
                  <th className="px-4 py-2">Compte</th>
                  <th className="px-4 py-2">Note</th>
                  <th className="px-4 py-2 text-right">Montant</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((t) => (
                  <tr key={t.id} className="border-t border-subtle/60">
                    <td className="px-4 py-2 text-muted">{dateFr(t.date)}</td>
                    <td className="px-4 py-2">
                      <div className="font-medium">{CATEGORY_LABEL[t.category]}</div>
                      <div className="text-xs text-muted">{TYPE_LABEL[t.type]}</div>
                    </td>
                    <td className="px-4 py-2 text-muted">{ACCOUNT_LABEL[t.account]}</td>
                    <td className="px-4 py-2 text-muted truncate max-w-[220px]">
                      {t.note || "—"}
                      {t.relatedUser && (
                        <span className="ml-1 text-xs text-muted-strong">· {t.relatedUser.name ?? t.relatedUser.email}</span>
                      )}
                    </td>
                    <td
                      className={`px-4 py-2 text-right tabular-nums font-medium ${
                        t.type === "INCOME" ? "text-success" : "text-danger"
                      }`}
                    >
                      {t.type === "INCOME" ? "+" : "−"}
                      {eur(t.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="rounded-lg border border-subtle bg-surface">
          <div className="px-4 py-3 border-b border-subtle flex justify-between items-center">
            <h2 className="font-medium">Dettes revendeurs</h2>
            <Link href="/finance/debts" className="text-sm text-muted hover:text-foreground">
              Payer →
            </Link>
          </div>
          {debts.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted">Tout est à jour ✓</div>
          ) : (
            <ul className="divide-y divide-subtle/60 text-sm">
              {debts.slice(0, 5).map((d) => (
                <li key={d.userId} className="px-4 py-3 flex justify-between">
                  <div>
                    <div className="font-medium">{d.name ?? d.email}</div>
                    <div className="text-xs text-muted">{d.pendingSalesCount} vente(s)</div>
                  </div>
                  <div className="tabular-nums font-medium text-warning">{eur(d.amount)}</div>
                </li>
              ))}
            </ul>
          )}

          <div className="px-4 py-3 mt-2 border-t border-subtle/60 text-sm flex justify-between">
            <span className="text-muted">Dépenses 30 j</span>
            <span className="tabular-nums font-medium text-danger">
              {eur(expenses30._sum.amount)}
            </span>
          </div>
        </section>
      </div>
    </>
  );
}
