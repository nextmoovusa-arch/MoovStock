"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "@/lib/toast";

export function NewItemForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    brand: "",
    category: "",
    size: "",
    condition: "",
    purchasePrice: 0,
    listingPrice: 0,
    photoUrl: "",
    vintedUrl: "",
    status: "IN_STOCK" as "IN_STOCK" | "LISTED",
    notes: "",
    quantity: 1,
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    const res = await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErr(data.error || "Erreur");
      toast.error("Création impossible", data.error);
      setLoading(false);
      return;
    }
    const data = await res.json().catch(() => ({}));
    const created = data.count ?? 1;
    toast.success(
      created > 1 ? `${created} articles créés` : "Article créé",
      created > 1 ? `${form.title} × ${created}` : form.title,
    );
    router.push("/my/items");
    router.refresh();
  }

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  return (
    <form onSubmit={submit} className="space-y-4 text-sm">
      <Row>
        <Field label="Titre *" required value={form.title} onChange={(v) => set("title", v)} />
      </Row>
      <Row cols={3}>
        <Field label="Marque" value={form.brand} onChange={(v) => set("brand", v)} />
        <Field label="Catégorie" value={form.category} onChange={(v) => set("category", v)} />
        <Field label="Taille" value={form.size} onChange={(v) => set("size", v)} />
      </Row>
      <Row cols={2}>
        <Field label="État" value={form.condition} onChange={(v) => set("condition", v)} placeholder="Très bon état" />
        <SelectField
          label="Statut initial"
          value={form.status}
          onChange={(v) => set("status", v as typeof form.status)}
          options={[
            { v: "IN_STOCK", l: "En stock (pas encore listé)" },
            { v: "LISTED", l: "Déjà en ligne sur Vinted" },
          ]}
        />
      </Row>
      <Row cols={3}>
        <NumField label="Prix d'achat unitaire (€) *" required value={form.purchasePrice} onChange={(v) => set("purchasePrice", v)} />
        <NumField label="Prix de mise en vente (€)" value={form.listingPrice} onChange={(v) => set("listingPrice", v)} />
        <NumField
          label="Quantité"
          step={1}
          value={form.quantity}
          onChange={(v) => set("quantity", Math.max(1, Math.min(500, Math.round(v))))}
        />
      </Row>

      {form.quantity > 1 && (
        <div className="rounded-md border border-accent/30 bg-accent/5 px-3 py-2 text-xs text-muted">
          <span className="text-foreground font-medium">{form.quantity} articles</span> seront créés à
          l&apos;identique · coût total :{" "}
          <span className="text-foreground font-medium tabular-nums">
            {(form.purchasePrice * form.quantity).toFixed(2)} €
          </span>
          {form.listingPrice > 0 && (
            <>
              {" · "}revenu potentiel :{" "}
              <span className="text-success font-medium tabular-nums">
                {(form.listingPrice * form.quantity).toFixed(2)} €
              </span>
            </>
          )}
        </div>
      )}

      <Row cols={2}>
        <Field label="URL photo" value={form.photoUrl} onChange={(v) => set("photoUrl", v)} placeholder="https://..." />
        <Field label="URL annonce Vinted" value={form.vintedUrl} onChange={(v) => set("vintedUrl", v)} placeholder="https://www.vinted.fr/..." />
      </Row>
      <label>
        <span className="block text-xs text-muted mb-1">Notes</span>
        <textarea
          rows={3}
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          className="w-full rounded-md border border-input px-3 py-2"
        />
      </label>

      {err && <div className="text-danger">{err}</div>}

      <div className="flex justify-end gap-2 pt-2 border-t border-subtle/60">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md px-3 py-2 hover:bg-surface-2"
        >
          Annuler
        </button>
        <button
          disabled={loading || !form.title || form.purchasePrice < 0}
          className="rounded-md bg-accent text-on-accent px-4 py-2 font-medium hover:bg-accent-strong disabled:opacity-50"
        >
          {loading ? "..." : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}

function Row({ children, cols = 1 }: { children: React.ReactNode; cols?: 1 | 2 | 3 }) {
  const g = cols === 1 ? "grid-cols-1" : cols === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-3";
  return <div className={`grid ${g} gap-3`}>{children}</div>;
}

function Field({
  label, value, onChange, required, placeholder,
}: { label: string; value: string; onChange: (v: string) => void; required?: boolean; placeholder?: string }) {
  return (
    <label>
      <span className="block text-xs text-muted mb-1">{label}</span>
      <input
        type="text"
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-input px-3 py-2"
      />
    </label>
  );
}

function NumField({
  label, value, onChange, required, step = 0.01,
}: { label: string; value: number; onChange: (v: number) => void; required?: boolean; step?: number }) {
  const isInt = step === 1;
  return (
    <label>
      <span className="block text-xs text-muted mb-1">{label}</span>
      <input
        type="number"
        step={step}
        min="0"
        required={required}
        value={value}
        onChange={(e) =>
          onChange(isInt ? parseInt(e.target.value || "0", 10) || 0 : parseFloat(e.target.value) || 0)
        }
        className="w-full rounded-md border border-input px-3 py-2 tabular-nums"
      />
    </label>
  );
}

function SelectField({
  label, value, onChange, options,
}: { label: string; value: string; onChange: (v: string) => void; options: { v: string; l: string }[] }) {
  return (
    <label>
      <span className="block text-xs text-muted mb-1">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-input px-3 py-2 bg-surface"
      >
        {options.map((o) => (
          <option key={o.v} value={o.v}>{o.l}</option>
        ))}
      </select>
    </label>
  );
}
