import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/PageHeader";
import { NewTransactionButton } from "../NewTransactionButton";
import { ACCOUNT_LABEL, CATEGORY_LABEL, TYPE_LABEL } from "../labels";
import { eur, dateFr } from "@/lib/format";
import { DeleteTxButton } from "./DeleteTxButton";

export const dynamic = "force-dynamic";

export default async function TransactionsPage() {
  await requireAdmin();

  const txs = await prisma.transaction.findMany({
    orderBy: { date: "desc" },
    take: 200,
    include: { relatedUser: true },
  });

  return (
    <>
      <PageHeader
        title="Transactions"
        subtitle={`${txs.length} dernières opérations`}
        action={<NewTransactionButton />}
      />

      <div className="rounded-lg border border-subtle bg-surface overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-muted bg-surface-2">
            <tr>
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Catégorie</th>
              <th className="px-4 py-2">Compte</th>
              <th className="px-4 py-2">Revendeur</th>
              <th className="px-4 py-2">Note</th>
              <th className="px-4 py-2 text-right">Montant</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {txs.map((t) => (
              <tr key={t.id} className="border-t border-subtle/60">
                <td className="px-4 py-2 text-muted">{dateFr(t.date)}</td>
                <td className="px-4 py-2">{TYPE_LABEL[t.type]}</td>
                <td className="px-4 py-2">{CATEGORY_LABEL[t.category]}</td>
                <td className="px-4 py-2 text-muted">{ACCOUNT_LABEL[t.account]}</td>
                <td className="px-4 py-2 text-muted">
                  {t.relatedUser ? t.relatedUser.name ?? t.relatedUser.email : "—"}
                </td>
                <td className="px-4 py-2 text-muted truncate max-w-[200px]">{t.note || "—"}</td>
                <td
                  className={`px-4 py-2 text-right tabular-nums font-medium ${
                    t.type === "INCOME" ? "text-success" : "text-danger"
                  }`}
                >
                  {t.type === "INCOME" ? "+" : "−"}
                  {eur(t.amount)}
                </td>
                <td className="px-4 py-2 text-right">
                  <DeleteTxButton txId={t.id} />
                </td>
              </tr>
            ))}
            {txs.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-sm text-muted">
                  Aucune transaction enregistrée.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
