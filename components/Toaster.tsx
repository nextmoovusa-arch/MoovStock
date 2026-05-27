"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { TOAST_EVENT, type ToastPayload } from "@/lib/toast";

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const TONE = {
  success: "border-success/40 text-success",
  error:   "border-danger/40 text-danger",
  warning: "border-warning/40 text-warning",
  info:    "border-accent/40 text-accent",
};

export function Toaster() {
  const [toasts, setToasts] = useState<ToastPayload[]>([]);

  useEffect(() => {
    function onToast(e: Event) {
      const ce = e as CustomEvent<ToastPayload>;
      const t = ce.detail;
      setToasts((cur) => [...cur, t]);
      setTimeout(() => {
        setToasts((cur) => cur.filter((x) => x.id !== t.id));
      }, t.duration ?? 3500);
    }
    window.addEventListener(TOAST_EVENT, onToast);
    return () => window.removeEventListener(TOAST_EVENT, onToast);
  }, []);

  function dismiss(id: string) {
    setToasts((cur) => cur.filter((x) => x.id !== id));
  }

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none max-w-sm">
      {toasts.map((t) => {
        const Icon = ICONS[t.variant ?? "info"];
        return (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto rounded-xl border bg-surface backdrop-blur shadow-2xl",
              "px-4 py-3 flex items-start gap-3 animate-slide-up",
              TONE[t.variant ?? "info"],
            )}
          >
            <Icon className="size-4 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground">{t.message}</div>
              {t.description && (
                <div className="text-xs text-muted mt-0.5">{t.description}</div>
              )}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="text-muted hover:text-foreground transition-colors"
              aria-label="Fermer"
            >
              <X className="size-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
