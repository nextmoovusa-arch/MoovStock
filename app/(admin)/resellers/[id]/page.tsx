import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/PageHeader";
import { KpiCard } from "@/components/KpiCard";
import { eur, dateFr, pct } from "@/lib/format";
import { ResellerSettingsForm } from "./ResellerSettingsForm";

export const dynamic = "force-dynamic";

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
  const [sales30, owed, lastLog, logs7] = await Promise.all([
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
  ]);

  const listed7 = logs7.reduce((s, l) => s + l.itemsListed, 0);
  const sold7 = logs7.reduce((s, l) => s + l.itemsSold, 0);

  return (
    <>
      <PageHeader
        title={user.name ?? user.email}
        subtitle={`${user.email} · ${user.role === "ADMIN" ? "Admin" : "Revendeur"}`}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="CA 30 j" value={eur(sales30._sum.soldPrice)} hint={`${sales30._count} ventes`} />
        <KpiCard label="Ma part 30 j" value={eur(sales30._sum.netProfit)} tone="positive" />
        <KpiCard label="À lui verser" value={eur(owed._sum.resellerPayout)} tone="warning" />
        <KpiCard
          label="Activité 7 j"
          value={`${listed7} postés`}
          hint={`${sold7} vendus · dernière saisie ${lastLog ? dateFr(lastLog.date) : "jamais"}`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border border-slate-200 bg-white p-6">
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

        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="font-medium mb-4">Résumé</h2>
          <dl className="text-sm space-y-2">
            <Row label="Articles totaux" value={String(user._count.items)} />
            <Row label="Ventes totales" value={String(user._count.sales)} />
            <Row label="Commission actuelle" value={pct(user.commissionRate)} />
            <Row label="Objectif quotidien" value={`${user.dailyGoalItems} articles`} />
            <Row label="Créé le" value={dateFr(user.createdAt)} />
            <Row label="Statut" value={user.active ? "Actif" : "Désactivé"} />
          </dl>
        </div>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-slate-100 pb-1.5">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium tabular-nums">{value}</dd>
    </div>
  );
}
