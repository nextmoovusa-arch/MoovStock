import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/PageHeader";
import { KpiCard } from "@/components/KpiCard";
import { ItemStatusBadge, PaymentStatusBadge } from "@/components/StatusBadge";
import { ActivityHeatmap } from "@/components/ActivityHeatmap";
import { ProgressBar } from "@/components/ProgressBar";
import { analyzeSupply } from "@/lib/supplies";
import { eur, dateFr, pct } from "@/lib/format";
import { ResellerSettingsForm } from "./ResellerSettingsForm";
import { Mail } from "lucide-react";

export const dynamic = "force-dynamic";

const SUPPLY_LABEL: Record<string, string> = {
  POUCH: "Pochettes",
  LABEL_ROLL: "Étiquettes",
  PRINTER_INK: "Encre",
  OTHER: "Autre",
};

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default async function ResellerDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      _count: { select: { items: true, sales: true } },
    },
  });
  if (!user) notFound();

  const since30 = new Date(Date.now() - 30 * 86400000);
  const since35 = new Date(Date.now() - 35 * 86400000);

  const [sales30, owed, lastLog, logs7, items, recentSales, recentLogs, supplies, heatLogs] =
    await Promise.all([
      prisma.sale.aggregate({
        where: { resellerId: user.id, soldAt: { gte: since30 } },
        _sum: { soldPrice: true, netProfit: true, resellerPayout: true },
        _count: true,
      }),
      prisma.sale.aggregate({
        where: { resellerId: user.id, paymentStatus: "PENDING" },
        _sum: { resellerPayout: true },
      }),
      prisma.dailyLog.findFirst({
        where: { userId: user.id },
        orderBy: { date: "desc" },
      }),
      prisma.dailyLog.findMany({
        where: { userId: user.id, date: { gte: new Date(Date.now() - 7 * 86400000) } },
        orderBy: { date: "asc" },
      }),
      prisma.item.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.sale.findMany({
        where: { resellerId: user.id },
        orderBy: { soldAt: "desc" },
        take: 10,
        include: { item: { select: { title: true } } },
      }),
      prisma.dailyLog.findMany({
        where: { userId: user.id },
        orderBy: { date: "desc" },
        take: 10,
      }),
      prisma.supply.findMany({
        where: { userId: user.id, active: true },
        orderBy: { type: "asc" },
      }),
      prisma.dailyLog.findMany({
        where: { userId: user.id, date: { gte: since35 } },
        select: { date: true, itemsListed: true },
      }),
    ]);

  const listed7 = logs7.reduce((s, l) => s + l.itemsListed, 0);
  const sold7 = logs7.reduce((s, l) => s + l.itemsSold, 0);
  const pendingInvite = !user.clerkId;

  const heat: Record<string, number> = {};
  for (const l of heatLogs) heat[ymd(new Date(l.date))] = l.itemsListed;

  const supplyAnalyses = await Promise.all(supplies.map((s) => analyzeSupply(s)));

  return (
    <>
      <PageHeader
        title={user.name ?? user.email}
        subtitle={`${user.email} · ${user.role === "ADMIN" ? "Admin" : "Revendeur"}`}
      />

      {pendingInvite && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm">
          <Mail className="size-4 mt-0.5 text-warning shrink-0" />
          <div>
            <div className="font-medium text-warning">Invitation en attente</div>
            <div className="text-muted">
              {user.email} doit s&apos;inscrire sur <code className="text-foreground">/sign-up</code> avec ce
              même email pour activer son compte. Les paramètres (objectif, commission) seront déjà
              en place.
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="CA 30 j"
          animateValue={sales30._sum.soldPrice ?? 0}
          format={(n) => eur(n)}
          hint={`${sales30._count} ventes`}
          delay={0}
        />
        <KpiCard
          label="Ma part 30 j"
          animateValue={sales30._sum.netProfit ?? 0}
          format={(n) => eur(n)}
          tone="positive"
          delay={60}
        />
        <KpiCard
          label="À lui verser"
          animateValue={owed._sum.resellerPayout ?? 0}
          format={(n) => eur(n)}
          tone="warning"
          delay={120}
        />
        <KpiCard
          label="Activité 7 j"
          value={`${listed7} postés`}
          hint={`${sold7} vendus · dernière saisie ${lastLog ? dateFr(lastLog.date) : "jamais"}`}
          delay={180}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="rounded-xl border border-subtle bg-surface p-6 animate-fade-in" style={{ animationDelay: "200ms" }}>
          <h2 className="font-medium mb-4">Paramètres</h2>
          <ResellerSettingsForm
            id={user.id}
            initial={{
              name: user.name,
              dailyGoalItems: user.dailyGoalItems,
              commissionRate: user.commissionRate,
              active: user.active,
              role: user.role,
            }}
          />
        </div>

        <div className="rounded-xl border border-subtle bg-surface p-6 animate-fade-in" style={{ animationDelay: "260ms" }}>
          <h2 className="font-medium mb-4">Résumé</h2>
          <dl className="text-sm space-y-2">
            <Row label="Articles totaux" value={String(user._count.items)} />
            <Row label="Ventes totales" value={String(user._count.sales)} />
            <Row label="Commission" value={pct(user.commissionRate)} />
            <Row label="Objectif quotidien" value={`${user.dailyGoalItems} articles`} />
            <Row label="Créé le" value={dateFr(user.createdAt)} />
            <Row label="Statut" value={user.active ? "Actif" : "Désactivé"} />
          </dl>
        </div>

        <div className="rounded-xl border border-subtle bg-surface p-6 animate-fade-in" style={{ animationDelay: "320ms" }}>
          <ActivityHeatmap data={heat} days={35} label="Activité 35 jours" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <section className="rounded-xl border border-subtle bg-surface overflow-hidden animate-fade-in" style={{ animationDelay: "340ms" }}>
          <div className="px-4 py-3 border-b border-subtle">
            <h2 className="font-medium">Derniers articles</h2>
          </div>
          {items.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted">Aucun article.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-muted bg-surface-2">
                <tr>
                  <th className="px-4 py-2">Article</th>
                  <th className="px-4 py-2">Statut</th>
                  <th className="px-4 py-2 text-right">Annonce</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.id} className="border-t border-subtle/60">
                    <td className="px-4 py-2">
                      <div className="font-medium">{it.title}</div>
                      <div className="text-xs text-muted">
                        {[it.brand, it.size].filter(Boolean).join(" · ") || "—"}
                      </div>
                    </td>
                    <td className="px-4 py-2"><ItemStatusBadge status={it.status} /></td>
                    <td className="px-4 py-2 text-right tabular-nums">{eur(it.listingPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="rounded-xl border border-subtle bg-surface overflow-hidden animate-fade-in" style={{ animationDelay: "400ms" }}>
          <div className="px-4 py-3 border-b border-subtle">
            <h2 className="font-medium">Dernières ventes</h2>
          </div>
          {recentSales.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted">Aucune vente.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-muted bg-surface-2">
                <tr>
                  <th className="px-4 py-2">Vendu le</th>
                  <th className="px-4 py-2">Article</th>
                  <th className="px-4 py-2 text-right">Prix</th>
                  <th className="px-4 py-2">Paiement</th>
                </tr>
              </thead>
              <tbody>
                {recentSales.map((s) => (
                  <tr key={s.id} className="border-t border-subtle/60">
                    <td className="px-4 py-2 text-muted">{dateFr(s.soldAt)}</td>
                    <td className="px-4 py-2 font-medium">{s.item.title}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{eur(s.soldPrice)}</td>
                    <td className="px-4 py-2"><PaymentStatusBadge status={s.paymentStatus} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="rounded-xl border border-subtle bg-surface overflow-hidden animate-fade-in" style={{ animationDelay: "460ms" }}>
          <div className="px-4 py-3 border-b border-subtle">
            <h2 className="font-medium">Saisies récentes</h2>
          </div>
          {recentLogs.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted">Aucune saisie.</div>
          ) : (
            <ul className="divide-y divide-subtle/60 text-sm">
              {recentLogs.map((l) => {
                const hit = l.itemsListed >= user.dailyGoalItems;
                return (
                  <li key={l.id} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium">{dateFr(l.date)}</div>
                      <div className="text-xs text-muted">
                        {l.itemsListed} postés · {l.itemsSold} vendus · {l.pouchesUsed} pochettes
                      </div>
                    </div>
                    <span
                      className={`text-xs rounded px-2 py-0.5 font-medium ${
                        hit ? "bg-success/15 text-success" : "bg-warning/15 text-warning"
                      }`}
                    >
                      {hit ? "✓" : `${l.itemsListed}/${user.dailyGoalItems}`}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-subtle bg-surface overflow-hidden animate-fade-in" style={{ animationDelay: "520ms" }}>
          <div className="px-4 py-3 border-b border-subtle">
            <h2 className="font-medium">Consommables</h2>
          </div>
          {supplies.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted">Aucun consommable suivi.</div>
          ) : (
            <ul className="divide-y divide-subtle/60 text-sm">
              {supplies.map((s, i) => {
                const a = supplyAnalyses[i];
                return (
                  <li key={s.id} className="px-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="font-medium">
                          {s.name ?? SUPPLY_LABEL[s.type] ?? s.type}
                        </div>
                        <div className="text-xs text-muted">
                          {a.avgDaily > 0
                            ? `Conso ~${a.avgDaily.toFixed(1)}/j · ${
                                a.daysRemaining !== null
                                  ? `${Math.floor(a.daysRemaining)} j`
                                  : "—"
                              }`
                            : "Pas de conso 7 j"}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold tabular-nums">{s.quantity}</div>
                        <div className="text-xs text-muted">seuil {a.thresholdUnits}</div>
                      </div>
                    </div>
                    <ProgressBar
                      value={s.quantity}
                      max={Math.max(a.thresholdUnits * 2, s.quantity)}
                      tone={a.critical ? "danger" : a.needsRestock ? "warning" : "success"}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-subtle/60 pb-1.5">
      <dt className="text-muted">{label}</dt>
      <dd className="font-medium tabular-nums">{value}</dd>
    </div>
  );
}
