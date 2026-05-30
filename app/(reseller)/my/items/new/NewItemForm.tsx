"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "@/lib/toast";
import { CATEGORIES, MAIN_CATEGORIES, getSubcategories } from "@/lib/categories";

export function NewItemForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [customListing, setCustomListing] = useState(false);
  const [form, setForm] = useState({
    title: "",
    brand: "",
    category: "Femmes",
    subcategory: CATEGORIES["Femmes"][0] ?? "",
    purchasePrice: 0,
    listingPrice: 0,
    quantity: 1,
  });

  const subOptions = getSubcategories(form.category);

  const suggested = +(form.purchasePrice * 2).toFixed(2);
  const effectiveListing = customListing ? form.listingPrice : suggested;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    const res = await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        brand: form.brand || null,
        category: form.category,
        subcategory: form.subcategory || null,
        purchasePrice: form.purchasePrice,
        listingPrice: effectiveListing,
        quantity: form.quantity,
        status: "IN_STOCK",
      }),
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
      <div>
        <span className="block text-xs text-muted mb-1">Nom *</span>
        <input
          type="text"
          required
          autoFocus
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="Ex: Jean Levis 501"
          className="w-full rounded-md border border-input px-3 py-2"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <span className="block text-xs text-muted mb-1">Marque</span>
          <input
            type="text"
            value={form.brand}
            onChange={(e) => set("brand", e.target.value)}
            placeholder="Ex: Levis"
            className="w-full rounded-md border border-input px-3 py-2"
          />
        </div>
        <div>
          <span className="block text-xs text-muted mb-1">Catégorie</span>
          <select
            value={form.category}
            onChange={(e) => {
              const newCat = e.target.value;
              const firstSub = getSubcategories(newCat)[0] ?? "";
              setForm((f) => ({ ...f, category: newCat, subcategory: firstSub }));
            }}
            className="w-full rounded-md border border-input px-3 py-2 bg-surface"
          >
            {MAIN_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <span className="block text-xs text-muted mb-1">Sous-catégorie</span>
        <select
          value={form.subcategory}
          onChange={(e) => set("subcategory", e.target.value)}
          className="w-full rounded-md border border-input px-3 py-2 bg-surface"
          disabled={subOptions.length === 0}
        >
          {subOptions.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <span className="block text-xs text-muted mb-1">Prix unitaire (€) *</span>
          <input
            type="number"
            required
            step="0.01"
            min="0"
            value={form.purchasePrice}
            onChange={(e) => set("purchasePrice", parseFloat(e.target.value) || 0)}
            className="w-full rounded-md border border-input px-3 py-2 tabular-nums"
          />
        </div>
        <div>
          <span className="flex items-center justify-between text-xs text-muted mb-1">
            <span>Prix revente (€)</span>
            <button
              type="button"
              onClick={() => {
                setCustomListing((v) => !v);
                if (!customListing) set("listingPrice", suggested);
              }}
              className="text-[10px] text-accent hover:underline"
            >
              {customListing ? "auto ×2" : "personnaliser"}
            </button>
          </span>
          {customListing ? (
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.listingPrice}
              onChange={(e) => set("listingPrice", parseFloat(e.target.value) || 0)}
              className="w-full rounded-md border border-input px-3 py-2 tabular-nums"
            />
          ) : (
            <div className="w-full rounded-md border border-accent/30 bg-accent/5 px-3 py-2 tabular-nums text-success font-medium">
              {suggested.toFixed(2)} €
            </div>
          )}
        </div>
        <div>
          <span className="block text-xs text-muted mb-1">Quantité</span>
          <input
            type="number"
            min="1"
            max="500"
            step="1"
            value={form.quantity}
            onChange={(e) => set("quantity", Math.max(1, Math.min(500, parseInt(e.target.value || "1", 10))))}
            className="w-full rounded-md border border-input px-3 py-2 tabular-nums"
          />
        </div>
      </div>

      {form.quantity > 1 && (
        <div className="rounded-md border border-accent/30 bg-accent/5 px-3 py-2 text-xs text-muted">
          <span className="text-foreground font-medium">{form.quantity} articles</span> seront créés à
          l&apos;identique · coût total :{" "}
          <span className="text-foreground font-medium tabular-nums">
            {(form.purchasePrice * form.quantity).toFixed(2)} €
          </span>
          {form.purchasePrice > 0 && (
            <>
              {" · "}revenu potentiel :{" "}
              <span className="text-success font-medium tabular-nums">
                {(effectiveListing * form.quantity).toFixed(2)} €
              </span>
            </>
          )}
        </div>
      )}

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
          disabled={loading || !form.title || form.purchasePrice <= 0}
          className="rounded-md bg-accent text-on-accent px-4 py-2 font-medium hover:bg-accent-strong disabled:opacity-50 active:scale-[0.98] transition-transform"
        >
          {loading ? "..." : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}
