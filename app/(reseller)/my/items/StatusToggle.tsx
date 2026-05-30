"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ItemStatus } from "@prisma/client";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

export function StatusToggle({ itemId, status }: { itemId: string; status: ItemStatus }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState<ItemStatus>(status);

  // Pas de toggle si vendu/perdu/retour
  if (current !== "IN_STOCK" && current !== "LISTED") {
    return null;
  }

  async function flip() {
    const next: ItemStatus = current === "IN_STOCK" ? "LISTED" : "IN_STOCK";
    setLoading(true);
    const res = await fetch(`/api/items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error("Changement impossible", data.error);
      return;
    }
    setCurrent(next);
    toast.success(next === "LISTED" ? "Article posté" : "Article retiré", undefined);
    router.refresh();
  }

  const listed = current === "LISTED";
  return (
    <button
      onClick={flip}
      disabled={loading}
      className={cn(
        "relative inline-flex items-center h-6 w-12 rounded-full transition-colors disabled:opacity-50",
        listed ? "bg-accent" : "bg-subtle",
      )}
      title={listed ? "Cliquer pour remettre en stock" : "Cliquer pour passer en ligne"}
    >
      <span
        className={cn(
          "inline-block size-4 rounded-full bg-white transition-transform shadow",
          listed ? "translate-x-7" : "translate-x-1",
        )}
      />
    </button>
  );
}
