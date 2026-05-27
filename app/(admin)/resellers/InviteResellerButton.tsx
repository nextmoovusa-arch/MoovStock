"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus, UserPlus, Copy, Check } from "lucide-react";
import { toast } from "@/lib/toast";

export function InviteResellerButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [createdEmail, setCreatedEmail] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({
    email: "",
    name: "",
    dailyGoalItems: 5,
    commissionRate: 0.5,
  });

  const signupUrl =
    typeof window !== "undefined" ? `${window.location.origin}/sign-up` : "/sign-up";

  async function submit() {
    setLoading(true);
    setErr(null);
    const res = await fetch("/api/resellers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErr(data.error || "Erreur");
      toast.error("Invitation impossible", data.error);
      return;
    }
    setCreatedEmail(form.email);
    toast.success("Revendeur invité", `${form.email} apparaîtra dès qu'il s'inscrira.`);
    router.refresh();
  }

  function close() {
    setOpen(false);
    setCreatedEmail(null);
    setCopied(false);
    setForm({ email: "", name: "", dailyGoalItems: 5, commissionRate: 0.5 });
    setErr(null);
  }

  function copyLink() {
    navigator.clipboard.writeText(signupUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-md bg-accent text-on-accent px-3 py-2 text-sm font-medium hover:bg-accent-strong transition-[transform,box-shadow] active:scale-[0.98] hover:shadow-glow"
      >
        <Plus className="size-4" />
        Inviter un revendeur
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-backdrop-in">
          <div className="bg-surface border border-subtle rounded-xl shadow-2xl w-full max-w-md p-5 animate-slide-up text-sm">
            {!createdEmail ? (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <div className="size-8 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-center text-accent">
                    <UserPlus className="size-4" />
                  </div>
                  <h3 className="font-semibold">Inviter un revendeur</h3>
                </div>

                <div className="space-y-3">
                  <label className="block">
                    <span className="block text-xs text-muted mb-1">Email *</span>
                    <input
                      type="email"
                      required
                      autoFocus
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="lucas@example.com"
                      className="w-full rounded-md border border-input px-3 py-2"
                    />
                  </label>

                  <label className="block">
                    <span className="block text-xs text-muted mb-1">Nom (optionnel)</span>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Lucas D."
                      className="w-full rounded-md border border-input px-3 py-2"
                    />
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className="block text-xs text-muted mb-1">Objectif / jour</span>
                      <input
                        type="number"
                        min="0"
                        value={form.dailyGoalItems}
                        onChange={(e) =>
                          setForm({ ...form, dailyGoalItems: parseInt(e.target.value || "0", 10) })
                        }
                        className="w-full rounded-md border border-input px-3 py-2 tabular-nums"
                      />
                    </label>
                    <label className="block">
                      <span className="block text-xs text-muted mb-1">
                        Commission ({Math.round(form.commissionRate * 100)} %)
                      </span>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={form.commissionRate}
                        onChange={(e) =>
                          setForm({ ...form, commissionRate: parseFloat(e.target.value) })
                        }
                        className="w-full mt-2"
                      />
                    </label>
                  </div>
                </div>

                {err && <div className="mt-3 text-danger text-xs">{err}</div>}

                <div className="mt-5 flex justify-end gap-2">
                  <button
                    onClick={close}
                    className="rounded-md px-3 py-1.5 hover:bg-surface-2 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={submit}
                    disabled={loading || !form.email}
                    className="rounded-md bg-accent text-on-accent px-3 py-1.5 font-medium hover:bg-accent-strong disabled:opacity-50 active:scale-[0.98] transition-transform"
                  >
                    {loading ? "..." : "Créer"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <div className="size-8 rounded-lg bg-success/15 border border-success/40 flex items-center justify-center text-success">
                    <Check className="size-4" />
                  </div>
                  <h3 className="font-semibold">Revendeur prêt</h3>
                </div>

                <p className="text-muted">
                  Envoie ce lien à <strong className="text-foreground">{createdEmail}</strong> :
                  il devra s&apos;inscrire avec ce même email pour que son compte soit activé.
                </p>

                <div className="mt-3 flex items-center gap-2 bg-surface-2 border border-subtle rounded-md px-3 py-2">
                  <span className="flex-1 text-xs truncate">{signupUrl}</span>
                  <button
                    onClick={copyLink}
                    className="text-xs rounded border border-subtle px-2 py-1 hover:bg-subtle transition-colors flex items-center gap-1"
                  >
                    {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
                    {copied ? "Copié" : "Copier"}
                  </button>
                </div>

                <div className="mt-5 flex justify-end">
                  <button
                    onClick={close}
                    className="rounded-md bg-accent text-on-accent px-3 py-1.5 font-medium hover:bg-accent-strong active:scale-[0.98] transition-transform"
                  >
                    Terminé
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
