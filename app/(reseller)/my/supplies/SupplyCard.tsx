"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Supply, SupplyMovement, MovementReason } from "@prisma/client";
import { cn } from "@/lib/utils";
import { eur, dateFr } from "@/lib/format";
import type { RestockAnalysis } from "@/lib/supplies";

const TYPE_LABEL: Record<string, string> = {
  POUCH: "Pochettes",
  LABEL_ROLL: "Étiquettes",
  PRINTER_INK: "Encre",
  OTHER: "Autre",
};

const REASON_LABEL: Record<MovementReason, string> = {
  RESTOCK: "Rachat",
  CONSUMPTION: "Conso.",
  MANUAL_ADJUST: "Ajust.",
  LOSS: "Perte",
};

export function SupplyCard({
  supply,
  analysis,
  movements,
}: {
  supply: Supply;
  analysis: RestockAnalysis;
  movements: SupplyMovement[];
}) {
  const router = useRouter();
  const [restockQty, setRestockQty] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const status = analysis.critical
    ? { label: "Critique", cls: "bg-rose-100 text-rose-700" }
    : analysis.needsRestock
    ? { label: "À racheter", cls: "bg-amber-100 text-amber-700" }
    : { label: "OK", cls: "bg-emerald-100 text-emerald-700" };

  async function restock() {
    if (restockQty <= 0) return;
    setLoading(true);
    setErr(null);
    const res = await fetch(`/api/supplies/${supply.id}/movements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ delta: restockQty, reason: "RESTOCK", note: "Rachat manuel" }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErr(data.error || "Erreur");
      return;
    }
    setRestockQty(0);
    router.refresh();
  }

  async function adjust(delta: number) {
    setLoading(true);
    setErr(null);
    const res = await fetch(`/api/supplies/${supply.id}/movements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ delta, reason: "MANUAL_ADJUST", note: "Ajustement rapide" }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErr(data.error || "Erreur");
      return;
    }
    router.refresh();
  }

  return (
    <div className={cn("rounded-lg border bg-white p-5", analysis.critical ? "border-rose-300" : "border-slate-200")}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500">
            {TYPE_LABEL[supply.type] ?? supply.type}
          </div>
          <div className="font-medium">{supply.name ?? TYPE_LABEL[supply.type]}</div>
        </div>
        <span className={cn("text-xs font-medium rounded px-2 py-0.5", status.cls)}>{status.label}</span>
      </div>

      <div className="text-3xl font-semibold tabular-nums mb-1">{supply.quantity}</div>
      <div className="text-xs text-slate-500 mb-4">
        {analysis.avgDaily > 0
          ? `Conso ~${analysis.avgDaily.toFixed(1)}/j · ${
              analysis.daysRemaining !== null ? `${Math.floor(analysis.daysRemaining)} j restants` : "—"
            } · seuil ${analysis.thresholdUnits}`
          : "Aucune conso enregistrée sur 7 j"}
      </div>

      <div className="flex gap-2 mb-3">
        <input
          type="number"
          min="1"
          placeholder="Quantité"
          value={restockQty || ""}
          onChange={(e) => setRestockQty(parseInt(e.target.value || "0", 10))}
          className="flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm tabular-nums"
        />
        <button
          onClick={restock}
          disabled={loading || restockQty <= 0}
          className="rounded-md bg-emerald-600 text-white px-3 py-1.5 text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
        >
          + Racheter
        </button>
      </div>

      <div className="flex gap-2 mb-3 text-xs">
        <button
          onClick={() => adjust(-1)}
          disabled={loading || supply.quantity <= 0}
          className="rounded border border-slate-200 px-2 py-1 hover:bg-slate-100 disabled:opacity-50"
        >
          −1
        </button>
        <button
          onClick={() => adjust(1)}
          disabled={loading}
          className="rounded border border-slate-200 px-2 py-1 hover:bg-slate-100 disabled:opacity-50"
        >
          +1
        </button>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="ml-auto text-slate-500 hover:text-slate-900"
        >
          {expanded ? "Masquer" : "Historique"}
        </button>
      </div>

      {err && <div className="text-xs text-rose-600 mb-2">{err}</div>}

      <div className="text-xs text-slate-500 border-t border-slate-100 pt-2">
        Coût unitaire {eur(supply.unitCost)} · délai {supply.restockLeadDays}j · marge {supply.safetyMarginDays}j
        {supply.lastRestockedAt && <> · racheté {dateFr(supply.lastRestockedAt)}</>}
      </div>

      {expanded && movements.length > 0 && (
        <ul className="mt-3 text-xs space-y-1 border-t border-slate-100 pt-2">
          {movements.map((m) => (
            <li key={m.id} className="flex justify-between text-slate-600">
              <span>
                {dateFr(m.createdAt)} · {REASON_LABEL[m.reason]}
              </span>
              <span className={cn("tabular-nums font-medium", m.delta > 0 ? "text-emerald-600" : "text-rose-600")}>
                {m.delta > 0 ? "+" : ""}
                {m.delta}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
