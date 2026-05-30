"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";

export default function SetupPage() {
  const router = useRouter();
  const [state, setState] = useState<"loading" | "promoted" | "already" | "blocked" | "error">("loading");
  const [msg, setMsg] = useState<string>("");

  useEffect(() => {
    fetch("/api/me/promote", { method: "POST" })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setState(res.status === 403 ? "blocked" : "error");
          setMsg(data.error ?? "Erreur");
          return;
        }
        if (data.alreadyAdmin) setState("already");
        else setState("promoted");
      })
      .catch((e) => {
        setState("error");
        setMsg(String(e));
      });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-xl border border-subtle bg-surface p-8 text-center">
        {state === "loading" && (
          <>
            <Loader2 className="size-10 mx-auto mb-4 text-accent animate-spin" />
            <h1 className="font-semibold mb-1">Configuration en cours…</h1>
            <p className="text-sm text-muted">Vérification de ton compte.</p>
          </>
        )}
        {state === "promoted" && (
          <>
            <CheckCircle2 className="size-10 mx-auto mb-4 text-success" />
            <h1 className="font-semibold mb-1">Tu es maintenant administrateur</h1>
            <p className="text-sm text-muted mb-6">Tu peux gérer ton réseau de revendeurs.</p>
            <button
              onClick={() => router.push("/dashboard")}
              className="rounded-md bg-accent text-on-accent px-4 py-2 text-sm font-medium hover:bg-accent-strong"
            >
              Aller au tableau de bord
            </button>
          </>
        )}
        {state === "already" && (
          <>
            <CheckCircle2 className="size-10 mx-auto mb-4 text-success" />
            <h1 className="font-semibold mb-1">Tu es déjà administrateur</h1>
            <button
              onClick={() => router.push("/dashboard")}
              className="mt-6 rounded-md bg-accent text-on-accent px-4 py-2 text-sm font-medium hover:bg-accent-strong"
            >
              Aller au tableau de bord
            </button>
          </>
        )}
        {(state === "blocked" || state === "error") && (
          <>
            <AlertTriangle className="size-10 mx-auto mb-4 text-warning" />
            <h1 className="font-semibold mb-1">
              {state === "blocked" ? "Promotion impossible" : "Erreur"}
            </h1>
            <p className="text-sm text-muted">{msg}</p>
          </>
        )}
      </div>
    </div>
  );
}
