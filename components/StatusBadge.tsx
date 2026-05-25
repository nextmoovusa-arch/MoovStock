import type { ItemStatus, PaymentStatus } from "@prisma/client";
import { cn } from "@/lib/utils";

const ITEM_LABEL: Record<ItemStatus, { label: string; cls: string }> = {
  IN_STOCK: { label: "En stock", cls: "bg-slate-100 text-slate-700" },
  LISTED:   { label: "En ligne", cls: "bg-blue-100 text-blue-700" },
  SOLD:     { label: "Vendu",    cls: "bg-emerald-100 text-emerald-700" },
  RETURNED: { label: "Retour",   cls: "bg-amber-100 text-amber-700" },
  LOST:     { label: "Perdu",    cls: "bg-rose-100 text-rose-700" },
};

const PAY_LABEL: Record<PaymentStatus, { label: string; cls: string }> = {
  PENDING:          { label: "À payer",   cls: "bg-amber-100 text-amber-700" },
  PAID_TO_RESELLER: { label: "Payé",      cls: "bg-emerald-100 text-emerald-700" },
  SETTLED:          { label: "Soldé",     cls: "bg-slate-100 text-slate-700" },
};

export function ItemStatusBadge({ status }: { status: ItemStatus }) {
  const s = ITEM_LABEL[status];
  return <span className={cn("inline-flex items-center rounded px-2 py-0.5 text-xs font-medium", s.cls)}>{s.label}</span>;
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const s = PAY_LABEL[status];
  return <span className={cn("inline-flex items-center rounded px-2 py-0.5 text-xs font-medium", s.cls)}>{s.label}</span>;
}
