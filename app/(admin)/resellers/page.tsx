import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/PageHeader";
import { eur } from "@/lib/format";
import { InviteResellerButton } from "./InviteResellerButton";
import { CommissionEdit } from "./CommissionEdit";
import { ViewAsButton } from "./ViewAsButton";
import { Mail } from "lucide-react";

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
        subtitle={`${resellers.length} compte(s) — clique sur le % pour modifier le partage.`}
        action={<InviteResellerButton />}
      />

      <div className="rounded-xl border border-subtle bg-surface overflow-hidden animate-fade-in">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-muted bg-surface-2">
            <tr>
              <th className="px-4 py-2">Revendeur</th>
              <th className="px-4 py-2 text-right">Articles</th>
              <th className="px-4 py-2 text-right">Ventes</th>
              <th className="px-4 py-2 text-right">CA</th>
              <th className="px-4 py-2 text-right">Partage</th>
              <th className="px-4 py-2 text-right">Dû</th>
              <th className="px-4 py-2 text-right">Obj./j</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {resellers.map((r) => {
              const ca = r.sales.reduce((s, x) => s + x.soldPrice, 0);
              const owed = r.sales
                .filter((s) => s.paymentStatus === "PENDING")
                .reduce((s, x) => s + x.resellerPayout, 0);
              const pendingInvite = !r.clerkId;
              return (
                <tr
                  key={r.id}
                  className="border-t border-subtle/60 hover:bg-surface-2 transition-colors"
                >
                  <td className="px-4 py-3">
                    <Link href={`/resellers/${r.id}`} className="block">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{r.name ?? "—"}</span>
                        {pendingInvite && (
                          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider rounded px-1.5 py-0.5 bg-warning/15 text-warning">
                            <Mail className="size-3" />
                            En attente
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted">{r.email}</div>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{r._count.items}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{r._count.sales}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{eur(ca)}</td>
                  <td className="px-4 py-3 text-right">
                    <CommissionEdit resellerId={r.id} initial={r.commissionRate} />
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium text-warning">
                    {eur(owed)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{r.dailyGoalItems}</td>
                  <td className="px-4 py-3 text-right">
                    <ViewAsButton resellerId={r.id} label={r.name ?? r.email} />
                  </td>
                </tr>
              );
            })}
            {resellers.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-sm text-muted">
                  Aucun revendeur pour l&apos;instant. Clique sur{" "}
                  <span className="text-foreground font-medium">« Inviter un revendeur »</span> pour
                  commencer.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
