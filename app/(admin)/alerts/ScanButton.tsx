"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { RefreshCw } from "lucide-react";

export function ScanButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function scan() {
    setLoading(true);
    const res = await fetch("/api/alerts/scan", { method: "POST" });
    setLoading(false);
    if (res.ok) router.refresh();
  }

  return (
    <button
      onClick={scan}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-md bg-accent text-on-accent px-3 py-2 text-sm font-medium hover:bg-accent-strong disabled:opacity-50"
    >
      <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
      Scanner
    </button>
  );
}
