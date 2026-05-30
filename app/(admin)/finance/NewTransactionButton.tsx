"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";

const TYPES = [
  { v: "EXPENSE", l: "Dépense" },
  { v: "INCOME", l: "Recette" },
  { v: "REFUND", l: "Remboursement" },
  { v: "RESELLER_PAYOUT", l: "Paiement revendeur" },
];

const CATEGORIES = [
  { v: "STOCK_BUY", l: "Achat stock" },
  { v: "SUPPLIES", l: "Consommables" },
  { v: "SHIPPING", l: "Transport / port" },
  { v: "AD", l: "Publicité" },
  { v: "EQUIPMENT", l: "Équipement" },
  { v: "TRANSPORT", l: "Déplacements" },
  { v: "PAYOUT", l: "Reversement revendeur" },
  { v: "REFUND", l: "Remboursement" },
  { v: "OTHER", l: "Autre" },
];

export function NewTransactionButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState({
    type: "EXPENSE",
    category: "STOCK_BUY",
    account: "BANK", // forcé au compte bancaire
    amount: 0,
    date: new Date().toISOString().slice(0, 10),
    note: "",
  });

  async function submit() {
    setLoading(true);
    setErr(null);
    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        date: new Date(form.date + "T12:00:00Z").toISOString(),
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErr(data.error || "Erreur");
      return;
    }
    setOpen(false);
    setForm({ ...form, amount: 0, note: "" });
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-md bg-accent text-on-accent px-3 py-2 text-sm font-medium hover:bg-accent-strong"
      >
        <Plus className="size-4" />
        Transaction
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-backdrop-in">
          <div className="bg-surface border border-subtle rounded-xl shadow-2xl w-full max-w-md p-5 animate-slide-up text-sm">
            <h3 className="font-semibold mb-3">Nouvelle transaction</h3>
            <div className="grid grid-cols-2 gap-3">
              <Select label="Type" value={form.type} onChange={(v) => setForm({ ...form, type: v })} options={TYPES} />
              <Select label="Catégorie" value={form.category} onChange={(v) => setForm({ ...form, category: v })} options={CATEGORIES} />
              <label className="col-span-2">
                <span className="block text-xs text-muted mb-1">Montant (€)</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={form.amount || ""}
                  onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-md border border-input px-2 py-1.5 tabular-nums"
                />
              </label>
              <label className="col-span-2">
                <span className="block text-xs text-muted mb-1">Date</span>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full rounded-md border border-input px-2 py-1.5"
                />
              </label>
              <label className="col-span-2">
                <span className="block text-xs text-muted mb-1">Note (optionnel)</span>
                <textarea
                  rows={2}
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  className="w-full rounded-md border border-input px-2 py-1.5"
                />
              </label>
            </div>

            {err && <div className="mt-3 text-danger text-xs">{err}</div>}

            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setOpen(false)} className="rounded-md px-3 py-1.5 hover:bg-surface-2">
                Annuler
              </button>
              <button
                onClick={submit}
                disabled={loading || form.amount <= 0}
                className="rounded-md bg-accent text-on-accent px-3 py-1.5 font-medium hover:bg-accent-strong disabled:opacity-50"
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

function Select({
  label, value, onChange, options,
}: { label: string; value: string; onChange: (v: string) => void; options: { v: string; l: string }[] }) {
  return (
    <label>
      <span className="block text-xs text-muted mb-1">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-input px-2 py-1.5 bg-surface"
      >
        {options.map((o) => (
          <option key={o.v} value={o.v}>{o.l}</option>
        ))}
      </select>
    </label>
  );
}
