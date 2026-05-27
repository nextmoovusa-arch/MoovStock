import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { analyzeSupply } from "@/lib/supplies";
import { PageHeader } from "@/components/PageHeader";
import { KpiCard } from "@/components/KpiCard";
import { eur } from "@/lib/format";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<string, string> = {
  POUCH: "Pochettes",
  LABEL_ROLL: "Étiquettes",
  PRINTER_INK: "Encre",
  OTHER: "Autre",
};

export default async function AdminSuppliesPage() {
  await requireAdmin();

  const supplies = await prisma.supply.findMany({
    where: { active: true },
    include: { user: true },
    orderBy: [{ user: { name: "asc" } }, { type: "asc" }],
  });

  const rows = await Promise.all(
    supplies.map(async (s) => ({
      supply: s,
      analysis: await analyzeSupply(s),
    })),
  );

  const restockCount = rows.filter((r) => r.analysis.critical || r.analysis.needsRestock).length;
  const totalValue = rows.reduce((sum, r) => sum + r.supply.quantity * r.supply.unitCost, 0);
  const uniqueResellers = new Set(rows.map((r) => r.supply.userId)).size;

  return (
    <>
      <PageHeader
        title="Stock consommables"
        subtitle="Vue globale des consommables de tous les revendeurs."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Revendeurs équipés" value={String(uniqueResellers)} />
        <KpiCard label="Références suivies" value={String(rows.length)} />
        <KpiCard
          label="À racheter"
          value={String(restockCount)}
          tone={restockCount > 0 ? "warning" : "default"}
        />
        <KpiCard label="Valeur du stock" value={eur(totalValue)} />
      </div>

      <div className="rounded-lg border border-subtle bg-surface overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-muted bg-surface-2">
            <tr>
              <th className="px-4 py-2">Revendeur</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2 text-right">Stock</th>
              <th className="px-4 py-2 text-right">Conso/j</th>
              <th className="px-4 py-2 text-right">Jours restants</th>
              <th className="px-4 py-2 text-right">Seuil</th>
              <th className="px-4 py-2">État</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ supply, analysis }) => {
              const tone = analysis.critical
                ? "text-danger bg-danger/10"
                : analysis.needsRestock
                ? "text-warning bg-warning/10"
                : "";
              return (
                <tr key={supply.id} className={cn("border-t border-subtle/60", tone)}>
                  <td className="px-4 py-3">
                    <Link href={`/resellers/${supply.userId}`} className="font-medium hover:underline">
                      {supply.user.name ?? supply.user.email}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{supply.name ?? TYPE_LABEL[supply.type]}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium">{supply.quantity}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{analysis.avgDaily.toFixed(1)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {analysis.daysRemaining === null
                      ? "—"
                      : analysis.daysRemaining < 1
                      ? "< 1 j"
                      : `${Math.floor(analysis.daysRemaining)} j`}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted">{analysis.thresholdUnits}</td>
                  <td className="px-4 py-3">
                    {analysis.critical ? (
                      <span className="text-xs font-medium rounded px-2 py-0.5 bg-danger/15 text-danger">
                        Critique
                      </span>
                    ) : analysis.needsRestock ? (
                      <span className="text-xs font-medium rounded px-2 py-0.5 bg-warning/15 text-warning">
                        À racheter
                      </span>
                    ) : (
                      <span className="text-xs font-medium rounded px-2 py-0.5 bg-success/15 text-success">
                        OK
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted">
                  Aucun consommable suivi. Demande à tes revendeurs d&apos;en ajouter via leur espace.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
