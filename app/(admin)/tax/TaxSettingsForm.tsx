"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

export function TaxSettingsForm({
  initial,
}: {
  initial: { businessMode: boolean; taxRate: number; urssafRate: number };
}) {
  const router = useRouter();
  const [businessMode, setBusinessMode] = useState(initial.businessMode);
  const [taxRate, setTaxRate] = useState(initial.taxRate);
  const [urssafRate, setUrssafRate] = useState(initial.urssafRate);
  const [loading, setLoading] = useState(false);

  async function save(next?: Partial<typeof initial>) {
    setLoading(true);
    const body = {
      businessMode: next?.businessMode ?? businessMode,
      taxRate: next?.taxRate ?? taxRate,
      urssafRate: next?.urssafRate ?? urssafRate,
    };
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      toast.error("Échec", d.error);
      return;
    }
    toast.success("Paramètres enregistrés");
    router.refresh();
  }

  async function toggleMode() {
    const next = !businessMode;
    setBusinessMode(next);
    await save({ businessMode: next });
  }

  return (
    <div className="space-y-4">
      {/* Toggle entreprise / particulier */}
      <div className="flex items-center justify-between gap-4 rounded-lg border border-subtle bg-surface-2 px-4 py-3">
        <div>
          <div className="text-sm font-medium">Mode entreprise</div>
          <div className="text-xs text-muted">
            Active les calculs URSSAF + impôts.
          </div>
        </div>
        <button
          onClick={toggleMode}
          disabled={loading}
          aria-pressed={businessMode}
          className={cn(
            "relative inline-flex items-center h-7 w-14 rounded-full transition-colors disabled:opacity-50",
            businessMode ? "bg-accent" : "bg-subtle",
          )}
        >
          <span
            className={cn(
              "inline-block size-5 rounded-full bg-white shadow transition-transform",
              businessMode ? "translate-x-8" : "translate-x-1",
            )}
          />
        </button>
      </div>

      {businessMode && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fade-in">
          <label className="block">
            <span className="flex items-center justify-between text-xs text-muted mb-1">
              <span>Taux URSSAF</span>
              <span className="text-accent font-medium">{(urssafRate * 100).toFixed(1)} %</span>
            </span>
            <input
              type="range"
              min="0"
              max="0.5"
              step="0.005"
              value={urssafRate}
              onChange={(e) => setUrssafRate(parseFloat(e.target.value))}
              onMouseUp={() => save()}
              onTouchEnd={() => save()}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-muted mt-1">
              <span>0 %</span>
              <span>25 %</span>
              <span>50 %</span>
            </div>
            <div className="grid grid-cols-4 gap-1 mt-2 text-[10px]">
              {[0.122, 0.21, 0.22, 0.232].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={async () => {
                    setUrssafRate(v);
                    await save({ urssafRate: v });
                  }}
                  className={cn(
                    "rounded border px-1.5 py-1 transition-colors",
                    Math.abs(urssafRate - v) < 0.001
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-subtle hover:bg-surface-2",
                  )}
                >
                  {(v * 100).toFixed(1)}%
                </button>
              ))}
            </div>
            <p className="text-[10px] text-muted mt-1">
              12.3% (BIC vente) · 21% (BIC service) · 22% (BNC micro) · 23.2% (BNC libéral)
            </p>
          </label>

          <label className="block">
            <span className="flex items-center justify-between text-xs text-muted mb-1">
              <span>Taux d&apos;impôts</span>
              <span className="text-accent font-medium">{(taxRate * 100).toFixed(1)} %</span>
            </span>
            <input
              type="range"
              min="0"
              max="0.5"
              step="0.005"
              value={taxRate}
              onChange={(e) => setTaxRate(parseFloat(e.target.value))}
              onMouseUp={() => save()}
              onTouchEnd={() => save()}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-muted mt-1">
              <span>0 %</span>
              <span>25 %</span>
              <span>50 %</span>
            </div>
            <div className="grid grid-cols-4 gap-1 mt-2 text-[10px]">
              {[0.11, 0.15, 0.25, 0.30].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={async () => {
                    setTaxRate(v);
                    await save({ taxRate: v });
                  }}
                  className={cn(
                    "rounded border px-1.5 py-1 transition-colors",
                    Math.abs(taxRate - v) < 0.001
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-subtle hover:bg-surface-2",
                  )}
                >
                  {(v * 100).toFixed(0)}%
                </button>
              ))}
            </div>
            <p className="text-[10px] text-muted mt-1">
              11% (TMI bas) · 15% (IS réduit) · 25% (IS standard) · 30% (TMI haut)
            </p>
          </label>
        </div>
      )}
    </div>
  );
}
