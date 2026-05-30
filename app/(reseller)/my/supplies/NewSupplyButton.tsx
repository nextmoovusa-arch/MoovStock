"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";

const TYPES = [
  { v: "POUCH", l: "Pochettes" },
  { v: "LABEL_ROLL", l: "Étiquettes" },
  { v: "PRINTER_INK", l: "Encre / toner" },
  { v: "OTHER", l: "Autre" },
];

export function NewSupplyButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState({
    type: "POUCH",
    name: "",
    quantity: 0,
    totalCost: 0, // saisi par l'utilisateur
    restockLeadDays: 3,
    safetyMarginDays: 2,
    restockThreshold: 0,
    useAutoThreshold: true,
  });

  // Coût unitaire calculé automatiquement
  const unitCost = form.quantity > 0 ? form.totalCost / form.quantity : 0;

  async function submit() {
    setLoading(true);
    setErr(null);
    const res = await fetch("/api/supplies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: form.type,
        name: form.name || null,
        quantity: form.quantity,
        unitCost: unitCost,
        restockLeadDays: form.restockLeadDays,
        safetyMarginDays: form.safetyMarginDays,
        restockThreshold: form.useAutoThreshold ? null : form.restockThreshold,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErr(data.error || "Erreur");
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-md bg-accent text-on-accent px-3 py-2 text-sm font-medium hover:bg-accent-strong"
      >
        <Plus className="size-4" />
        Ajouter
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-backdrop-in">
          <div className="bg-surface border border-subtle rounded-xl shadow-2xl w-full max-w-md p-5 animate-slide-up text-sm">
            <h3 className="font-semibold mb-3">Nouveau consommable</h3>
            <div className="grid grid-cols-2 gap-3">
              <label className="col-span-2">
                <span className="block text-xs text-muted mb-1">Type</span>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full rounded-md border border-input px-2 py-1.5 bg-surface"
                >
                  {TYPES.map((t) => (
                    <option key={t.v} value={t.v}>{t.l}</option>
                  ))}
                </select>
              </label>
              <label className="col-span-2">
                <span className="block text-xs text-muted mb-1">Nom (optionnel)</span>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: Pochettes 25x35"
                  className="w-full rounded-md border border-input px-2 py-1.5"
                />
              </label>
              <Num label="Quantité" value={form.quantity} onChange={(v) => setForm({ ...form, quantity: v })} />
              <Num label="Coût total payé (€)" value={form.totalCost} onChange={(v) => setForm({ ...form, totalCost: v })} step={0.01} />

              <div className="col-span-2 rounded-md border border-accent/20 bg-accent/5 px-3 py-2 text-xs flex justify-between items-center">
                <span className="text-muted">Coût unitaire calculé :</span>
                <span className="text-accent font-medium tabular-nums">
                  {unitCost > 0 ? `${unitCost.toFixed(4)} €/u` : "—"}
                </span>
              </div>
              <Num label="Délai livraison (j)" value={form.restockLeadDays} onChange={(v) => setForm({ ...form, restockLeadDays: v })} />
              <Num label="Marge sécurité (j)" value={form.safetyMarginDays} onChange={(v) => setForm({ ...form, safetyMarginDays: v })} />

              <label className="col-span-2 flex items-center gap-2 mt-1">
                <input
                  type="checkbox"
                  checked={form.useAutoThreshold}
                  onChange={(e) => setForm({ ...form, useAutoThreshold: e.target.checked })}
                />
                <span>Seuil de rachat automatique (conso × (délai + marge))</span>
              </label>
              {!form.useAutoThreshold && (
                <Num
                  label="Seuil manuel (unités)"
                  value={form.restockThreshold}
                  onChange={(v) => setForm({ ...form, restockThreshold: v })}
                />
              )}
            </div>

            {err && <div className="mt-3 text-danger text-xs">{err}</div>}

            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setOpen(false)} className="rounded-md px-3 py-1.5 hover:bg-surface-2">
                Annuler
              </button>
              <button
                onClick={submit}
                disabled={loading}
                className="rounded-md bg-accent text-on-accent px-3 py-1.5 font-medium hover:bg-accent-strong disabled:opacity-50"
              >
                {loading ? "..." : "Créer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Num({
  label, value, onChange, step = 1,
}: { label: string; value: number; onChange: (v: number) => void; step?: number }) {
  return (
    <label>
      <span className="block text-xs text-muted mb-1">{label}</span>
      <input
        type="number"
        min="0"
        step={step}
        value={value}
        onChange={(e) => onChange(step === 1 ? parseInt(e.target.value || "0", 10) : parseFloat(e.target.value) || 0)}
        className="w-full rounded-md border border-input px-2 py-1.5 tabular-nums"
      />
    </label>
  );
}
