import type { ItemStatus, PaymentStatus } from "@prisma/client";
import { cn } from "@/lib/utils";

const ITEM_LABEL: Record<ItemStatus, { label: string; cls: string }> = {
  IN_STOCK: { label: "En stock", cls: "bg-subtle text-muted" },
  LISTED:   { label: "En ligne", cls: "bg-accent/10 text-accent" },
  SOLD:     { label: "Vendu",    cls: "bg-success/15 text-success" },
  RETURNED: { label: "Retour",   cls: "bg-warning/15 text-warning" },
  LOST:     { label: "Perdu",    cls: "bg-danger/15 text-danger" },
};

const PAY_LABEL: Record<PaymentStatus, { label: string; cls: string }> = {
  PENDING:          { label: "À payer", cls: "bg-warning/15 text-warning" },
  PAID_TO_RESELLER: { label: "Payé",    cls: "bg-success/15 text-success" },
  SETTLED:          { label: "Soldé",   cls: "bg-subtle text-muted" },
};

export function ItemStatusBadge({ status }: { status: ItemStatus }) {
  const s = ITEM_LABEL[status];
  return <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium", s.cls)}>{s.label}</span>;
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const s = PAY_LABEL[status];
  return <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium", s.cls)}>{s.label}</span>;
}
