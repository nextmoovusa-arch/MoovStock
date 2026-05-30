"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";

const CONDITIONS = [
  "Neuf avec étiquette",
  "Neuf sans étiquette",
  "Très bon état",
  "Bon état",
  "Satisfaisant",
];

export function MarkSoldButton({
  itemId,
  suggested,
  pouchCost,
  labelCost,
}: {
  itemId: string;
  suggested: number;
  pouchCost: number;
  labelCost: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState({
    soldPrice: suggested || 0,
    condition: "Très bon état",
  });

  async function submit() {
    setLoading(true);
    setErr(null);
    const res = await fetch("/api/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        itemId,
        soldPrice: form.soldPrice,
        condition: form.condition,
        // Frais déduits automatiquement côté serveur depuis les supplies
        pouchCost,
        labelCost,
        vintedFee: 0,
        otherCost: 0,
        shippingFee: 0,
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErr(data.error || "Erreur");
      toast.error("Échec de la vente", data.error);
      setLoading(false);
      return;
    }
    setOpen(false);
    setLoading(false);
    toast.success("Vente enregistrée", `${form.soldPrice.toFixed(2)} € · ${form.condition}`);
    router.refresh();
  }

  const totalFees = pouchCost + labelCost;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs font-medium rounded-md bg-accent text-on-accent px-2 py-1 hover:bg-accent-strong transition-transform active:scale-95"
      >
        Vendu
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-backdrop-in">
          <div className="bg-surface border border-subtle rounded-xl shadow-2xl w-full max-w-md p-5 animate-slide-up">
            <h3 className="font-semibold mb-4">Marquer comme vendu</h3>

            <div className="space-y-4 text-sm">
              <div>
                <span className="block text-xs text-muted mb-1">Prix vendu TTC (€)</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  autoFocus
                  value={form.soldPrice || ""}
                  onChange={(e) => setForm({ ...form, soldPrice: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-md border border-input px-3 py-2 text-lg tabular-nums font-medium"
                />
              </div>

              <div>
                <span className="block text-xs text-muted mb-1">État de l&apos;article</span>
                <select
                  value={form.condition}
                  onChange={(e) => setForm({ ...form, condition: e.target.value })}
                  className="w-full rounded-md border border-input px-3 py-2 bg-surface"
                >
                  {CONDITIONS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {totalFees > 0 && (
                <div className="rounded-md border border-accent/20 bg-accent/5 px-3 py-2 text-xs text-muted flex justify-between">
                  <span>Frais consommables auto :</span>
                  <span className="text-foreground tabular-nums font-medium">
                    pochette {pouchCost.toFixed(2)}€ · étiquette {labelCost.toFixed(2)}€
                  </span>
                </div>
              )}
            </div>

            {err && <div className="mt-3 text-danger text-xs">{err}</div>}

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-1.5 text-sm hover:bg-surface-2 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={submit}
                disabled={loading || form.soldPrice <= 0}
                className="rounded-md bg-accent text-on-accent px-4 py-1.5 text-sm font-medium hover:bg-accent-strong disabled:opacity-50 active:scale-[0.98] transition-transform"
              >
                {loading ? "..." : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
