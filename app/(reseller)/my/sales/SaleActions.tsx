"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "@/lib/toast";

export function SaleActions({
  saleId,
  initial,
}: {
  saleId: string;
  initial: { soldPrice: number };
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [soldPrice, setSoldPrice] = useState(initial.soldPrice);

  async function saveEdit() {
    setLoading(true);
    const res = await fetch(`/api/sales/${saleId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ soldPrice }),
    });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      toast.error("Échec", d.error);
      return;
    }
    toast.success("Vente mise à jour");
    setEditOpen(false);
    router.refresh();
  }

  async function del() {
    if (!confirm("Supprimer cette vente ? L'article repassera en ligne et les consommables seront restaurés.")) return;
    setLoading(true);
    const res = await fetch(`/api/sales/${saleId}`, { method: "DELETE" });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      toast.error("Suppression impossible", d.error);
      return;
    }
    toast.success("Vente supprimée");
    router.refresh();
  }

  return (
    <>
      <div className="inline-flex gap-1">
        <button
          onClick={() => setEditOpen(true)}
          className="rounded-md border border-subtle p-1.5 hover:bg-surface-2 transition-colors"
          title="Modifier"
        >
          <Pencil className="size-3.5" />
        </button>
        <button
          onClick={del}
          disabled={loading}
          className="rounded-md border border-subtle p-1.5 hover:bg-danger/10 hover:border-danger/40 hover:text-danger transition-colors disabled:opacity-50"
          title="Supprimer"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>

      {editOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-backdrop-in"
          onClick={() => setEditOpen(false)}
        >
          <div
            className="bg-surface border border-subtle rounded-xl shadow-2xl w-full max-w-sm p-5 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold mb-3">Modifier la vente</h3>
            <label className="block text-sm">
              <span className="block text-xs text-muted mb-1">Prix vendu (€)</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                autoFocus
                value={soldPrice}
                onChange={(e) => setSoldPrice(parseFloat(e.target.value) || 0)}
                className="w-full rounded-md border border-input px-3 py-2 tabular-nums"
              />
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setEditOpen(false)}
                className="rounded-md px-3 py-1.5 text-sm hover:bg-surface-2"
              >
                Annuler
              </button>
              <button
                onClick={saveEdit}
                disabled={loading || soldPrice <= 0}
                className="rounded-md bg-accent text-on-accent px-4 py-1.5 text-sm font-medium hover:bg-accent-strong disabled:opacity-50"
              >
                {loading ? "..." : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
