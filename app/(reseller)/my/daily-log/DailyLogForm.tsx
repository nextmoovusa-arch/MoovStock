"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "@/lib/toast";

type Initial = {
  itemsListed: number;
  itemsSold: number;
  pouchesUsed: number;
  labelsUsed: number;
  issues: string | null;
};

export function DailyLogForm({
  date,
  goal,
  initial,
}: {
  date: string; // YYYY-MM-DD
  goal: number;
  initial?: Initial;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    date,
    itemsListed: initial?.itemsListed ?? 0,
    itemsSold: initial?.itemsSold ?? 0,
    pouchesUsed: initial?.pouchesUsed ?? 0,
    labelsUsed: initial?.labelsUsed ?? 0,
    issues: initial?.issues ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    setOk(false);
    const res = await fetch("/api/daily-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErr(data.error || "Erreur");
      toast.error("Échec de l'enregistrement", data.error);
      return;
    }
    setOk(true);
    toast.success("Saisie enregistrée", `${form.itemsListed} articles postés aujourd'hui.`);
    router.refresh();
  }

  const goalHit = form.itemsListed >= goal;
  const mismatch = Math.abs(form.itemsSold - form.pouchesUsed) >= 3;

  return (
    <form onSubmit={submit} className="space-y-4 text-sm">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Num
          label="Articles postés"
          value={form.itemsListed}
          onChange={(v) => setForm({ ...form, itemsListed: v })}
          tone={goalHit ? "ok" : "warn"}
          hint={`Obj. ${goal}`}
        />
        <Num
          label="Articles vendus"
          value={form.itemsSold}
          onChange={(v) => setForm({ ...form, itemsSold: v })}
        />
        <Num
          label="Pochettes utilisées"
          value={form.pouchesUsed}
          onChange={(v) => setForm({ ...form, pouchesUsed: v })}
        />
        <Num
          label="Étiquettes utilisées"
          value={form.labelsUsed}
          onChange={(v) => setForm({ ...form, labelsUsed: v })}
        />
      </div>

      <label className="block">
        <span className="block text-xs text-muted mb-1">Problèmes du jour (optionnel)</span>
        <textarea
          rows={3}
          value={form.issues ?? ""}
          onChange={(e) => setForm({ ...form, issues: e.target.value })}
          className="w-full rounded-md border border-input px-3 py-2"
          placeholder="Imprimante HS, colis annulé, perte..."
        />
      </label>

      {mismatch && (
        <div className="text-xs rounded-md bg-warning/10 border border-warning/30 text-warning px-3 py-2">
          Écart ventes ({form.itemsSold}) vs pochettes ({form.pouchesUsed}) — c&apos;est normal ?
        </div>
      )}

      {err && <div className="text-danger">{err}</div>}
      {ok && <div className="text-success">Saisie enregistrée ✓</div>}

      <div className="flex justify-end">
        <button
          disabled={loading}
          className="rounded-md bg-accent text-on-accent px-4 py-2 font-medium hover:bg-accent-strong disabled:opacity-50"
        >
          {loading ? "..." : initial ? "Mettre à jour" : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}

function Num({
  label,
  value,
  onChange,
  tone,
  hint,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  tone?: "ok" | "warn";
  hint?: string;
}) {
  const ring =
    tone === "ok" ? "ring-success/30" : tone === "warn" ? "ring-warning/30" : "ring-transparent";
  return (
    <label className="block">
      <span className="block text-xs text-muted mb-1 flex items-center justify-between">
        <span>{label}</span>
        {hint && <span className="text-muted-strong">{hint}</span>}
      </span>
      <input
        type="number"
        min="0"
        step="1"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value || "0", 10))}
        className={`w-full rounded-md border border-input px-3 py-2 tabular-nums ring-2 ${ring}`}
      />
    </label>
  );
}
