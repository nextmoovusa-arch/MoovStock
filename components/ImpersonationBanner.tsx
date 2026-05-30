"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, X } from "lucide-react";

export function ImpersonationBanner({ label }: { label: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function exit() {
    setLoading(true);
    await fetch("/api/impersonate", { method: "DELETE" });
    setLoading(false);
    router.push("/resellers");
    router.refresh();
  }

  return (
    <div className="sticky top-0 z-40 flex items-center justify-between gap-3 bg-accent text-on-accent px-4 py-2 text-sm font-medium shadow-lg">
      <div className="flex items-center gap-2">
        <Eye className="size-4" />
        <span>Tu regardes l&apos;espace de <strong>{label}</strong></span>
      </div>
      <button
        onClick={exit}
        disabled={loading}
        className="inline-flex items-center gap-1 rounded-md bg-on-accent/10 hover:bg-on-accent/20 px-2 py-1 text-xs transition-colors disabled:opacity-50"
      >
        <X className="size-3" />
        Revenir admin
      </button>
    </div>
  );
}
