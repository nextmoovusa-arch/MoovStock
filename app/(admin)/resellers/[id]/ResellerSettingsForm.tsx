"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Role } from "@prisma/client";

type Initial = {
  name: string | null;
  dailyGoalItems: number;
  commissionRate: number;
  active: boolean;
  role: Role;
};

export function ResellerSettingsForm({ id, initial }: { id: string; initial: Initial }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: initial.name ?? "",
    dailyGoalItems: initial.dailyGoalItems,
    commissionRate: initial.commissionRate,
    active: initial.active,
    role: initial.role,
  });
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    setOk(false);
    const res = await fetch(`/api/resellers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name || null,
        dailyGoalItems: form.dailyGoalItems,
        commissionRate: form.commissionRate,
        active: form.active,
        role: form.role,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErr(data.error || "Erreur");
      return;
    }
    setOk(true);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-3 text-sm">
      <label className="block">
        <span className="block text-xs text-slate-500 mb-1">Nom affiché</span>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full rounded-md border border-slate-300 px-3 py-2"
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="block text-xs text-slate-500 mb-1">Objectif articles / jour</span>
          <input
            type="number"
            min="0"
            value={form.dailyGoalItems}
            onChange={(e) => setForm({ ...form, dailyGoalItems: parseInt(e.target.value || "0", 10) })}
            className="w-full rounded-md border border-slate-300 px-3 py-2 tabular-nums"
          />
        </label>
        <label className="block">
          <span className="block text-xs text-slate-500 mb-1">
            Commission revendeur ({Math.round(form.commissionRate * 100)} %)
          </span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={form.commissionRate}
            onChange={(e) => setForm({ ...form, commissionRate: parseFloat(e.target.value) })}
            className="w-full"
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="block text-xs text-slate-500 mb-1">Rôle</span>
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
            className="w-full rounded-md border border-slate-300 px-3 py-2 bg-white"
          >
            <option value="RESELLER">Revendeur</option>
            <option value="ADMIN">Admin</option>
          </select>
        </label>
        <label className="flex items-end gap-2 pb-2">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm({ ...form, active: e.target.checked })}
            className="rounded"
          />
          <span>Compte actif</span>
        </label>
      </div>

      {err && <div className="text-rose-600">{err}</div>}
      {ok && <div className="text-emerald-600">Enregistré ✓</div>}

      <div className="flex justify-end pt-2 border-t border-slate-100">
        <button
          disabled={loading}
          className="rounded-md bg-slate-900 text-white px-4 py-2 font-medium hover:bg-slate-800 disabled:opacity-50"
        >
          {loading ? "..." : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}
