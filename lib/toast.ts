// Mini bus de toasts — dispatch côté client, écoute dans <Toaster/>.
// Pas de dépendance externe ; basé sur window CustomEvent.

export type ToastVariant = "success" | "error" | "info" | "warning";

export interface ToastPayload {
  id: string;
  message: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number; // ms
}

const EVENT_NAME = "moovstock-toast";

export function toast(
  message: string,
  options?: { description?: string; variant?: ToastVariant; duration?: number },
) {
  if (typeof window === "undefined") return;
  const payload: ToastPayload = {
    id: cryptoId(),
    message,
    description: options?.description,
    variant: options?.variant ?? "info",
    duration: options?.duration ?? 3500,
  };
  window.dispatchEvent(new CustomEvent<ToastPayload>(EVENT_NAME, { detail: payload }));
}

toast.success = (msg: string, desc?: string) =>
  toast(msg, { variant: "success", description: desc });
toast.error = (msg: string, desc?: string) =>
  toast(msg, { variant: "error", description: desc });
toast.warning = (msg: string, desc?: string) =>
  toast(msg, { variant: "warning", description: desc });
toast.info = (msg: string, desc?: string) =>
  toast(msg, { variant: "info", description: desc });

export const TOAST_EVENT = EVENT_NAME;

function cryptoId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
