"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AlertActions({ alertId }: { alertId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function resolve() {
    setLoading(true);
    const res = await fetch(`/api/alerts/${alertId}`, { method: "PATCH" });
    setLoading(false);
    if (res.ok) router.refresh();
  }

  return (
    <button
      onClick={resolve}
      disabled={loading}
      className="text-xs font-medium rounded-md border border-slate-200 px-2 py-1 hover:bg-slate-100 disabled:opacity-50"
    >
      {loading ? "..." : "Résoudre"}
    </button>
  );
}
