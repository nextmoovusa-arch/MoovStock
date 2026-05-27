import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/PageHeader";
import { dateFr } from "@/lib/format";
import { AlertActions } from "./AlertActions";
import { ScanButton } from "./ScanButton";
import { LiveDot } from "@/components/LiveDot";
import type { AlertSeverity, AlertType } from "@prisma/client";

export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<AlertType, string> = {
  INACTIVITY: "Inactivité",
  GOAL_MISSED: "Objectif manqué",
  LOW_STOCK: "Stock bas",
  RESTOCK_NOW: "Rachat urgent",
  STOCK_MISMATCH: "Incohérence stock",
};

const SEV_CLS: Record<AlertSeverity, string> = {
  INFO: "bg-subtle text-foreground",
  WARNING: "bg-warning/15 text-warning",
  CRITICAL: "bg-danger/15 text-danger",
};

export default async function AlertsPage() {
  const [openAlerts, resolved] = await Promise.all([
    prisma.alert.findMany({
      where: { resolvedAt: null },
      orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
      include: { user: true },
    }),
    prisma.alert.findMany({
      where: { resolvedAt: { not: null } },
      orderBy: { resolvedAt: "desc" },
      take: 10,
      include: { user: true },
    }),
  ]);

  return (
    <>
      <PageHeader
        title="Alertes"
        subtitle={`${openAlerts.length} alerte(s) ouverte(s).`}
        action={<ScanButton />}
      />

      <section className="rounded-lg border border-subtle bg-surface overflow-hidden mb-8">
        {openAlerts.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted">
            Aucune alerte ouverte. Tout est sous contrôle ✓
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-muted bg-surface-2">
              <tr>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2">Niveau</th>
                <th className="px-4 py-2">Message</th>
                <th className="px-4 py-2">Revendeur</th>
                <th className="px-4 py-2">Créée</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {openAlerts.map((a) => (
                <tr key={a.id} className="border-t border-subtle/60 hover:bg-surface-2 transition-colors">
                  <td className="px-4 py-3 font-medium">{TYPE_LABEL[a.type]}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-medium ${SEV_CLS[a.severity]}`}>
                      {a.severity === "CRITICAL" && <LiveDot tone="danger" size={6} />}
                      {a.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3">{a.message}</td>
                  <td className="px-4 py-3 text-muted">{a.user?.name ?? a.user?.email ?? "—"}</td>
                  <td className="px-4 py-3 text-muted">{dateFr(a.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <AlertActions alertId={a.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {resolved.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-muted mb-2">Récemment résolues</h2>
          <div className="rounded-lg border border-subtle bg-surface overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                {resolved.map((a) => (
                  <tr key={a.id} className="border-t border-subtle/60">
                    <td className="px-4 py-2 text-muted">{TYPE_LABEL[a.type]}</td>
                    <td className="px-4 py-2 text-muted">{a.message}</td>
                    <td className="px-4 py-2 text-muted-strong text-xs">{dateFr(a.resolvedAt!)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}
