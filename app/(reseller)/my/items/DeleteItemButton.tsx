"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";

export function DeleteItemButton({ itemId }: { itemId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onClick() {
    if (!confirm("Supprimer cet article ?")) return;
    setLoading(true);
    const res = await fetch(`/api/items/${itemId}`, { method: "DELETE" });
    setLoading(false);
    if (res.ok) router.refresh();
    else alert("Erreur");
  }

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="text-xs rounded-md border border-slate-200 px-2 py-1 hover:bg-slate-100 disabled:opacity-50"
      title="Supprimer"
    >
      <Trash2 className="size-3.5" />
    </button>
  );
}
