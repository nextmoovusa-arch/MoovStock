import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/PageHeader";
import { eur, pct } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ResellersPage() {
  const resellers = await prisma.user.findMany({
    where: { role: "RESELLER" },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { items: true, sales: true } },
      sales: { select: { soldPrice: true, netProfit: true, resellerPayout: true, paymentStatus: true } },
    },
  });

  return (
    <>
      <PageHeader
        title="Revendeurs"
        subtitle={`${resellers.length} compte(s) — gère leurs objectifs et leurs paiements.`}
      />

      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-slate-500 bg-slate-50">
            <tr>
              <th className="px-4 py-2">Revendeur</th>
              <th className="px-4 py-2 text-right">Articles</th>
              <th className="px-4 py-2 text-right">Ventes</th>
              <th className="px-4 py-2 text-right">CA</th>
              <th className="px-4 py-2 text-right">Commission</th>
              <th className="px-4 py-2 text-right">Dû</th>
              <th className="px-4 py-2 text-right">Objectif/j</th>
            </tr>
          </thead>
          <tbody>
            {resellers.map((r) => {
              const ca = r.sales.reduce((s, x) => s + x.soldPrice, 0);
              const owed = r.sales
                .filter((s) => s.paymentStatus === "PENDING")
                .reduce((s, x) => s + x.resellerPayout, 0);
              return (
                <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/resellers/${r.id}`} className="block">
                      <div className="font-medium">{r.name ?? "—"}</div>
                      <div className="text-xs text-slate-500">{r.email}</div>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{r._count.items}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{r._count.sales}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{eur(ca)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{pct(r.commissionRate)}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium text-amber-700">
                    {eur(owed)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{r.dailyGoalItems}</td>
                </tr>
              );
            })}
            {resellers.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">
                  Aucun revendeur pour l&apos;instant. Invite-les à créer un compte via{" "}
                  <Link href="/sign-up" className="underline">
                    /sign-up
                  </Link>
                  .
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
