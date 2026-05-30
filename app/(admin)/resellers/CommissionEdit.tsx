"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "@/lib/toast";

export function CommissionEdit({
  resellerId,
  initial,
}: {
  resellerId: string;
  initial: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [value, setValue] = useState(initial);

  async function save() {
    setLoading(true);
    const res = await fetch(`/api/resellers/${resellerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commissionRate: value }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error("Échec", data.error);
      return;
    }
    toast.success("Commission mise à jour", `${Math.round(value * 100)}% pour le revendeur`);
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        className="text-xs font-medium tabular-nums hover:underline cursor-pointer rounded px-1.5 py-0.5 hover:bg-accent/10 hover:text-accent transition-colors"
        title="Modifier la commission"
      >
        {Math.round(initial * 100)} %
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-backdrop-in"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-surface border border-subtle rounded-xl shadow-2xl w-full max-w-sm p-5 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold mb-1">Modifier le partage</h3>
            <p className="text-xs text-muted mb-4">
              Part du bénéfice brut reversée au revendeur.
            </p>

            <div className="text-center mb-3">
              <div className="text-4xl font-semibold tabular-nums text-accent">
                {Math.round(value * 100)} %
              </div>
              <div className="text-xs text-muted mt-1">
                Le revendeur · {Math.round((1 - value) * 100)} % pour toi
              </div>
            </div>

            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={value}
              onChange={(e) => setValue(parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-muted mt-1">
              <span>0 %</span>
              <span>50 %</span>
              <span>100 %</span>
            </div>

            <div className="grid grid-cols-4 gap-2 mt-4">
              {[0.3, 0.4, 0.5, 0.6].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setValue(v)}
                  className={`text-xs rounded-md border px-2 py-1.5 transition-colors ${
                    Math.abs(value - v) < 0.001
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-subtle hover:bg-surface-2"
                  }`}
                >
                  {Math.round(v * 100)} %
                </button>
              ))}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-1.5 text-sm hover:bg-surface-2 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={save}
                disabled={loading}
                className="rounded-md bg-accent text-on-accent px-4 py-1.5 text-sm font-medium hover:bg-accent-strong disabled:opacity-50 active:scale-[0.98] transition-transform"
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
