"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";

export function DeleteTxButton({ txId }: { txId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onClick() {
    if (!confirm("Supprimer cette transaction ? Si liée à un paiement, la vente repassera en 'À payer'.")) return;
    setLoading(true);
    const res = await fetch(`/api/transactions/${txId}`, { method: "DELETE" });
    setLoading(false);
    if (res.ok) router.refresh();
  }

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="text-xs rounded-md border border-subtle px-2 py-1 hover:bg-surface-2 disabled:opacity-50"
      title="Supprimer"
    >
      <Trash2 className="size-3.5" />
    </button>
  );
}
