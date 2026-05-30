import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/PageHeader";
import { KpiCard } from "@/components/KpiCard";
import { eur, dateFr } from "@/lib/format";
import { Plus, AlertCircle } from "lucide-react";
import { MarkSoldButton } from "./MarkSoldButton";
import { DeleteItemButton } from "./DeleteItemButton";
import { StatusToggle } from "./StatusToggle";
import { RepublishButton } from "./RepublishButton";

export const dynamic = "force-dynamic";

const REPUBLISH_DAYS = 10;

type FilterValue = "all" | "not_listed" | "listed" | "republish";

const FILTERS: { v: FilterValue; label: string }[] = [
  { v: "all", label: "Tous" },
  { v: "not_listed", label: "Pas posté" },
  { v: "listed", label: "En ligne" },
  { v: "republish", label: "À republier" },
];

export default async function MyItemsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const filter: FilterValue =
    (params.filter as FilterValue) && FILTERS.some((f) => f.v === params.filter)
      ? (params.filter as FilterValue)
      : "all";

  const [items, pouchSupply, labelSupply] = await Promise.all([
    prisma.item.findMany({
      where: {
        userId: user.id,
        status: { in: ["IN_STOCK", "LISTED"] }, // exclut SOLD/RETURNED/LOST
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    }),
    prisma.supply.findFirst({
      where: { userId: user.id, type: "POUCH", active: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.supply.findFirst({
      where: { userId: user.id, type: "LABEL_ROLL", active: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const pouchCost = pouchSupply?.unitCost ?? 0;
  const labelCost = labelSupply?.unitCost ?? 0;

  const now = Date.now();
  const republishThreshold = now - REPUBLISH_DAYS * 86400000;

  const notListed = items.filter((i) => i.status === "IN_STOCK");
  const listed = items.filter((i) => i.status === "LISTED");
  const toRepublish = listed.filter(
    (i) => i.listedAt && new Date(i.listedAt).getTime() < republishThreshold,
  );

  const filtered = (() => {
    switch (filter) {
      case "not_listed": return notListed;
      case "listed":     return listed;
      case "republish":  return toRepublish;
      default:           return items;
    }
  })();

  function daysSinceListed(date: Date | null): number | null {
    if (!date) return null;
    return Math.floor((now - new Date(date).getTime()) / 86400000);
  }

  return (
    <>
      <PageHeader
        title="Mes articles"
        subtitle="Gère ton stock et ce qui est en ligne sur Vinted."
        action={
          <Link
            href="/my/items/new"
            className="inline-flex items-center gap-2 rounded-md bg-accent text-on-accent px-3 py-2 text-sm font-medium hover:bg-accent-strong active:scale-[0.98] transition-transform"
          >
            <Plus className="size-4" />
            Ajouter un article
          </Link>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Stock total" animateValue={items.length} delay={0} />
        <KpiCard
          label="Pas posté"
          animateValue={notListed.length}
          hint="à mettre en ligne"
          delay={60}
        />
        <KpiCard
          label="En ligne"
          animateValue={listed.length}
          tone="positive"
          delay={120}
        />
        <KpiCard
          label="À republier"
          animateValue={toRepublish.length}
          hint={`postés depuis > ${REPUBLISH_DAYS} j`}
          tone={toRepublish.length > 0 ? "warning" : "default"}
          delay={180}
        />
      </div>

      {toRepublish.length > 0 && filter !== "republish" && (
        <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm animate-fade-in">
          <div className="flex items-center gap-3">
            <AlertCircle className="size-5 text-warning shrink-0" />
            <div>
              <div className="font-medium text-warning">
                {toRepublish.length} article{toRepublish.length > 1 ? "s" : ""} à republier
              </div>
              <div className="text-muted text-xs">
                Postés depuis plus de {REPUBLISH_DAYS} jours — un coup de boost remonte ton annonce.
              </div>
            </div>
          </div>
          <Link
            href="/my/items?filter=republish"
            className="text-xs font-medium rounded-md bg-warning text-on-accent px-3 py-1.5 hover:opacity-90"
          >
            Voir
          </Link>
        </div>
      )}

      {/* Tabs filtre */}
      <div className="inline-flex rounded-lg border border-subtle bg-surface p-1 mb-4">
        {FILTERS.map((f) => {
          const active = f.v === filter;
          const count =
            f.v === "all" ? items.length :
            f.v === "not_listed" ? notListed.length :
            f.v === "listed" ? listed.length :
            toRepublish.length;
          return (
            <Link
              key={f.v}
              href={f.v === "all" ? "/my/items" : `/my/items?filter=${f.v}`}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                active ? "bg-accent-soft text-accent" : "text-muted hover:text-foreground"
              }`}
            >
              {f.label} <span className="tabular-nums opacity-70">({count})</span>
            </Link>
          );
        })}
      </div>

      <div className="rounded-xl border border-subtle bg-surface overflow-hidden animate-fade-in">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-muted bg-surface-2">
            <tr>
              <th className="px-4 py-2">Article</th>
              <th className="px-4 py-2">En ligne ?</th>
              <th className="px-4 py-2 text-right">Achat</th>
              <th className="px-4 py-2 text-right">Prix annonce</th>
              <th className="px-4 py-2">Posté depuis</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((it) => {
              const days = daysSinceListed(it.listedAt);
              const needsRepublish =
                it.status === "LISTED" && days !== null && days >= REPUBLISH_DAYS;
              return (
                <tr key={it.id} className="border-t border-subtle/60 hover:bg-surface-2 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium">{it.title}</div>
                    <div className="text-xs text-muted">
                      {[it.brand, it.category].filter(Boolean).join(" · ") || "—"}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusToggle itemId={it.id} status={it.status} />
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{eur(it.purchasePrice)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{eur(it.listingPrice)}</td>
                  <td className="px-4 py-3 text-xs">
                    {it.status === "LISTED" && days !== null ? (
                      <span className={needsRepublish ? "text-warning font-medium" : "text-muted"}>
                        {days === 0 ? "aujourd'hui" : `${days} j`}
                        {needsRepublish && " ⚠"}
                      </span>
                    ) : it.status === "LISTED" ? (
                      <span className="text-muted">—</span>
                    ) : (
                      <span className="text-muted">pas posté</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      {needsRepublish && <RepublishButton itemId={it.id} />}
                      <MarkSoldButton
                        itemId={it.id}
                        suggested={it.listingPrice}
                        pouchCost={pouchCost}
                        labelCost={labelCost}
                      />
                      <DeleteItemButton itemId={it.id} />
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted">
                  {filter === "all"
                    ? <>Aucun article. <Link href="/my/items/new" className="underline text-accent">Ajoute le premier</Link>.</>
                    : "Rien à afficher dans ce filtre."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted mt-4">
        Les articles vendus sont automatiquement déplacés dans{" "}
        <Link href="/my/sales" className="underline text-accent">Mes ventes</Link>.
      </p>
    </>
  );
}
