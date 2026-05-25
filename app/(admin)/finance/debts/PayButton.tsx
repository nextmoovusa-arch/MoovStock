"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { eur } from "@/lib/format";

const ACCOUNTS = [
  { v: "BANK", l: "Banque" },
  { v: "CASH", l: "Espèces" },
  { v: "PAYPAL", l: "PayPal" },
  { v: "REVOLUT", l: "Revolut" },
  { v: "OTHER", l: "Autre" },
];

export function PayButton({ resellerId, amount }: { resellerId: string; amount: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [account, setAccount] = useState("BANK");
  const [note, setNote] = useState("");

  async function submit() {
    setLoading(true);
    setErr(null);
    const res = await fetch("/api/payouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resellerId, account, note: note || null }),
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
        className="rounded-md bg-emerald-600 text-white px-3 py-2 text-sm font-medium hover:bg-emerald-700"
      >
        Payer {eur(amount)}
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-5 text-sm">
            <h3 className="font-semibold mb-3">Confirmer le paiement</h3>
            <p className="text-slate-600 mb-4">
              Marquer toutes les ventes en attente comme payées et créer les transactions de
              reversement pour <strong>{eur(amount)}</strong> ?
            </p>

            <label className="block mb-3">
              <span className="block text-xs text-slate-500 mb-1">Compte source</span>
              <select
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-2 py-1.5 bg-white"
              >
                {ACCOUNTS.map((a) => (
                  <option key={a.v} value={a.v}>{a.l}</option>
                ))}
              </select>
            </label>

            <label className="block mb-3">
              <span className="block text-xs text-slate-500 mb-1">Note (optionnel)</span>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ref virement, mois..."
                className="w-full rounded-md border border-slate-300 px-2 py-1.5"
              />
            </label>

            {err && <div className="text-rose-600 text-xs mb-2">{err}</div>}

            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setOpen(false)} className="rounded-md px-3 py-1.5 hover:bg-slate-100">
                Annuler
              </button>
              <button
                onClick={submit}
                disabled={loading}
                className="rounded-md bg-emerald-600 text-white px-3 py-1.5 font-medium hover:bg-emerald-700 disabled:opacity-50"
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
