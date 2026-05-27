"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { eur } from "@/lib/format";
import { toast } from "@/lib/toast";

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
      toast.error("Échec du paiement", data.error);
      return;
    }
    setOpen(false);
    toast.success(`Paiement de ${eur(amount)} effectué`, "Les ventes sont marquées comme payées.");
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-md bg-accent text-on-accent px-3 py-2 text-sm font-medium hover:bg-accent-strong"
      >
        Payer {eur(amount)}
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-backdrop-in">
          <div className="bg-surface border border-subtle rounded-xl shadow-2xl w-full max-w-md p-5 animate-slide-up text-sm">
            <h3 className="font-semibold mb-3">Confirmer le paiement</h3>
            <p className="text-muted mb-4">
              Marquer toutes les ventes en attente comme payées et créer les transactions de
              reversement pour <strong>{eur(amount)}</strong> ?
            </p>

            <label className="block mb-3">
              <span className="block text-xs text-muted mb-1">Compte source</span>
              <select
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                className="w-full rounded-md border border-input px-2 py-1.5 bg-surface"
              >
                {ACCOUNTS.map((a) => (
                  <option key={a.v} value={a.v}>{a.l}</option>
                ))}
              </select>
            </label>

            <label className="block mb-3">
              <span className="block text-xs text-muted mb-1">Note (optionnel)</span>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ref virement, mois..."
                className="w-full rounded-md border border-input px-2 py-1.5"
              />
            </label>

            {err && <div className="text-danger text-xs mb-2">{err}</div>}

            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setOpen(false)} className="rounded-md px-3 py-1.5 hover:bg-surface-2">
                Annuler
              </button>
              <button
                onClick={submit}
                disabled={loading}
                className="rounded-md bg-accent text-on-accent px-3 py-1.5 font-medium hover:bg-accent-strong disabled:opacity-50"
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
