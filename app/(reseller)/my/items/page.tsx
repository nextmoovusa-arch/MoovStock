import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/PageHeader";
import { ItemStatusBadge } from "@/components/StatusBadge";
import { eur, dateFr } from "@/lib/format";
import { Plus } from "lucide-react";
import { MarkSoldButton } from "./MarkSoldButton";
import { DeleteItemButton } from "./DeleteItemButton";

export const dynamic = "force-dynamic";

export default async function MyItemsPage() {
  const user = await requireUser();

  const items = await prisma.item.findMany({
    where: { userId: user.id },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: { sale: true },
  });

  const inStock = items.filter((i) => i.status === "IN_STOCK" || i.status === "LISTED");
  const sold = items.filter((i) => i.status === "SOLD");

  return (
    <>
      <PageHeader
        title="Mes articles"
        subtitle={`${inStock.length} en stock · ${sold.length} vendus`}
        action={
          <Link
            href="/my/items/new"
            className="inline-flex items-center gap-2 rounded-md bg-accent text-on-accent px-3 py-2 text-sm font-medium hover:bg-accent-strong"
          >
            <Plus className="size-4" />
            Ajouter un article
          </Link>
        }
      />

      <div className="rounded-lg border border-subtle bg-surface overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-muted bg-surface-2">
            <tr>
              <th className="px-4 py-2">Article</th>
              <th className="px-4 py-2">Statut</th>
              <th className="px-4 py-2 text-right">Achat</th>
              <th className="px-4 py-2 text-right">Prix annonce</th>
              <th className="px-4 py-2 text-right">Vendu</th>
              <th className="px-4 py-2">Ajouté</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id} className="border-t border-subtle/60">
                <td className="px-4 py-3">
                  <div className="font-medium">{it.title}</div>
                  <div className="text-xs text-muted">
                    {[it.brand, it.category, it.size].filter(Boolean).join(" · ") || "—"}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <ItemStatusBadge status={it.status} />
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{eur(it.purchasePrice)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{eur(it.listingPrice)}</td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {it.sale ? eur(it.sale.soldPrice) : "—"}
                </td>
                <td className="px-4 py-3 text-muted">{dateFr(it.createdAt)}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    {it.status !== "SOLD" && <MarkSoldButton itemId={it.id} suggested={it.listingPrice} />}
                    <DeleteItemButton itemId={it.id} />
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted">
                  Aucun article. <Link href="/my/items/new" className="underline">Ajoute le premier</Link>.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
