"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";

export function MarkSoldButton({ itemId, suggested }: { itemId: string; suggested: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState({
    soldPrice: suggested || 0,
    vintedFee: 0,
    pouchCost: Number(process.env.NEXT_PUBLIC_DEFAULT_POUCH_COST ?? 0.15),
    labelCost: Number(process.env.NEXT_PUBLIC_DEFAULT_LABEL_COST ?? 0.05),
    otherCost: 0,
    shippingFee: 0,
    buyerCountry: "FR",
  });

  async function submit() {
    setLoading(true);
    setErr(null);
    const res = await fetch("/api/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, ...form }),
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
    toast.success("Vente enregistrée", `Article vendu ${form.soldPrice.toFixed(2)} €`);
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs font-medium rounded-md bg-accent text-on-accent px-2 py-1 hover:bg-accent-strong"
      >
        Vendu
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-backdrop-in">
          <div className="bg-surface border border-subtle rounded-xl shadow-2xl w-full max-w-md p-5 animate-slide-up">
            <h3 className="font-semibold mb-3">Marquer comme vendu</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Field label="Prix vendu (€)" value={form.soldPrice} onChange={(v) => setForm({ ...form, soldPrice: v })} />
              <Field label="Frais Vinted (€)" value={form.vintedFee} onChange={(v) => setForm({ ...form, vintedFee: v })} />
              <Field label="Pochette (€)" value={form.pouchCost} onChange={(v) => setForm({ ...form, pouchCost: v })} />
              <Field label="Étiquette (€)" value={form.labelCost} onChange={(v) => setForm({ ...form, labelCost: v })} />
              <Field label="Autres frais (€)" value={form.otherCost} onChange={(v) => setForm({ ...form, otherCost: v })} />
              <Field label="Port acheteur (€)" value={form.shippingFee} onChange={(v) => setForm({ ...form, shippingFee: v })} />
              <label className="col-span-2">
                <span className="block text-xs text-muted mb-1">Pays acheteur</span>
                <input
                  type="text"
                  value={form.buyerCountry}
                  onChange={(e) => setForm({ ...form, buyerCountry: e.target.value.toUpperCase() })}
                  className="w-full rounded-md border-input border px-2 py-1.5"
                />
              </label>
            </div>

            {err && <div className="mt-3 text-sm text-danger">{err}</div>}

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-1.5 text-sm hover:bg-surface-2"
              >
                Annuler
              </button>
              <button
                onClick={submit}
                disabled={loading || form.soldPrice <= 0}
                className="rounded-md bg-accent text-on-accent px-3 py-1.5 text-sm font-medium hover:bg-accent-strong disabled:opacity-50"
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

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label>
      <span className="block text-xs text-muted mb-1">{label}</span>
      <input
        type="number"
        step="0.01"
        min="0"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-full rounded-md border-input border px-2 py-1.5 tabular-nums"
      />
    </label>
  );
}
