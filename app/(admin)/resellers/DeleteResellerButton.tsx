"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "@/lib/toast";

export function DeleteResellerButton({
  resellerId,
  label,
  hasSales,
}: {
  resellerId: string;
  label: string;
  hasSales: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function confirm() {
    setLoading(true);
    const res = await fetch(`/api/resellers/${resellerId}`, { method: "DELETE" });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      toast.error("Suppression impossible", d.error);
      return;
    }
    toast.success(
      hasSales ? `${label} désactivé` : `${label} supprimé`,
      hasSales ? "Accès révoqué, historique conservé." : "Compte et données supprimés.",
    );
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
        className="inline-flex items-center justify-center size-7 rounded-md border border-subtle hover:border-danger/40 hover:text-danger hover:bg-danger/10 transition-colors"
        title="Supprimer ce revendeur"
        aria-label="Supprimer"
      >
        <Trash2 className="size-3.5" />
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-backdrop-in"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-surface border border-danger/30 rounded-xl shadow-2xl w-full max-w-md p-5 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold mb-1 text-danger">Supprimer {label} ?</h3>
            <p className="text-sm text-muted mt-2">
              {hasSales ? (
                <>
                  Comme ce revendeur a déjà des ventes en historique, son compte sera{" "}
                  <strong className="text-foreground">désactivé</strong> :
                  son accès est révoqué (compte Clerk supprimé) mais ses ventes restent dans
                  l&apos;historique pour la trésorerie.
                </>
              ) : (
                <>
                  Aucune vente liée : suppression <strong className="text-foreground">complète</strong>{" "}
                  du compte Clerk, des articles, consommables, saisies et alertes.
                  Action <strong>irréversible</strong>.
                </>
              )}
            </p>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-1.5 text-sm hover:bg-surface-2 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={confirm}
                disabled={loading}
                className="rounded-md bg-danger text-white px-4 py-1.5 text-sm font-medium hover:opacity-90 disabled:opacity-50 active:scale-[0.98] transition-transform"
              >
                {loading ? "..." : hasSales ? "Désactiver" : "Supprimer définitivement"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
