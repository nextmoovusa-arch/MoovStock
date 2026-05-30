"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "@/lib/toast";

export function RepublishButton({ itemId }: { itemId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function go() {
    setLoading(true);
    const res = await fetch(`/api/items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ republish: true }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error("Échec republier", data.error);
      return;
    }
    toast.success("Article republié", "Le compteur 10 jours repart à zéro.");
    router.refresh();
  }

  return (
    <button
      onClick={go}
      disabled={loading}
      className="inline-flex items-center gap-1 text-xs font-medium rounded-md border border-warning/30 bg-warning/10 text-warning px-2 py-1 hover:bg-warning/20 disabled:opacity-50 transition-colors"
      title="Republier maintenant"
    >
      <RefreshCw className={`size-3 ${loading ? "animate-spin" : ""}`} />
      Republier
    </button>
  );
}
