"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye } from "lucide-react";
import { toast } from "@/lib/toast";

export function ViewAsButton({ resellerId, label }: { resellerId: string; label: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function go(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    const res = await fetch("/api/impersonate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resellerId }),
    });
    setLoading(false);
    if (!res.ok) {
      toast.error("Impossible d'ouvrir son espace");
      return;
    }
    toast.success(`Tu regardes l'espace de ${label}`);
    router.push("/my/items");
    router.refresh();
  }

  return (
    <button
      onClick={go}
      disabled={loading}
      className="inline-flex items-center gap-1 text-xs font-medium rounded-md border border-subtle px-2 py-1 hover:border-accent/40 hover:text-accent hover:bg-accent/10 disabled:opacity-50 transition-colors"
      title="Voir son espace en tant qu'admin"
    >
      <Eye className="size-3" />
      Voir son espace
    </button>
  );
}
