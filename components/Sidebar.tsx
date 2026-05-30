"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { eur } from "@/lib/format";
import { LiveDot } from "./LiveDot";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Wallet,
  Package,
  ShoppingBag,
  ClipboardList,
  Boxes,
  Bell,
  BarChart3,
  Menu,
  X,
  Receipt,
} from "lucide-react";

type Item = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
  badgeTone?: "warning" | "danger" | "default";
};

export function Sidebar({
  isAdmin,
  userLabel,
  badges,
}: {
  isAdmin: boolean;
  userLabel: string;
  badges?: { alerts?: number; dailyLogPending?: boolean; suppliesAlert?: boolean; debts?: number };
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const ADMIN_ITEMS: Item[] = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/resellers", label: "Revendeurs", icon: Users },
    {
      href: "/alerts",
      label: "Alertes",
      icon: Bell,
      badge: badges?.alerts && badges.alerts > 0 ? badges.alerts : undefined,
      badgeTone: "danger",
    },
    {
      href: "/finance",
      label: "Finance",
      icon: Wallet,
      badge: badges?.debts && badges.debts > 0 ? eur(badges.debts) : undefined,
      badgeTone: "warning",
    },
    { href: "/tax", label: "Imposition", icon: Receipt },
    { href: "/supplies", label: "Stock conso.", icon: Boxes },
  ];

  const RESELLER_ITEMS: Item[] = [
    { href: "/my/items", label: "Mes articles", icon: Package },
    { href: "/my/sales", label: "Mes ventes", icon: ShoppingBag },
    {
      href: "/my/daily-log",
      label: "Saisie du jour",
      icon: ClipboardList,
      badge: badges?.dailyLogPending ? "!" : undefined,
      badgeTone: "warning",
    },
    {
      href: "/my/supplies",
      label: "Mes consommables",
      icon: Boxes,
      badge: badges?.suppliesAlert ? "!" : undefined,
      badgeTone: "danger",
    },
  ];

  const renderLink = (it: Item) => {
    const active = pathname === it.href || pathname.startsWith(it.href + "/");
    const Icon = it.icon;
    return (
      <Link
        key={it.href}
        href={it.href}
        onClick={() => setOpen(false)}
        className={cn(
          "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition relative",
          active
            ? "bg-accent-soft text-accent"
            : "text-muted hover:text-foreground hover:bg-surface-2",
        )}
      >
        {active && <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-accent" />}
        <Icon className={cn("size-4 transition", active ? "text-accent" : "text-muted group-hover:text-foreground")} />
        <span className="flex-1 font-medium">{it.label}</span>
        {it.badge !== undefined && (
          <span
            className={cn(
              "text-[10px] font-semibold rounded-full px-1.5 py-0.5 min-w-[18px] text-center whitespace-nowrap tabular-nums inline-flex items-center gap-1",
              it.badgeTone === "danger" && "bg-danger/20 text-danger",
              it.badgeTone === "warning" && "bg-warning/20 text-warning",
              (!it.badgeTone || it.badgeTone === "default") && "bg-subtle text-foreground",
            )}
          >
            {it.badgeTone === "danger" && <LiveDot tone="danger" size={6} />}
            {it.badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <>
      {/* Hamburger mobile */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Menu"
        className="md:hidden fixed top-3 left-3 z-30 size-10 rounded-lg bg-surface border border-subtle flex items-center justify-center hover:bg-surface-2 shadow-lg"
      >
        <Menu className="size-5" />
      </button>

      {/* Backdrop mobile */}
      {open && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-backdrop-in"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={cn(
          "w-64 shrink-0 bg-surface/95 backdrop-blur border-r border-subtle flex flex-col",
          "fixed inset-y-0 left-0 z-50 transition-transform",
          "md:static md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        <button
          onClick={() => setOpen(false)}
          aria-label="Fermer"
          className="md:hidden absolute top-3 right-3 size-8 rounded-md hover:bg-surface-2 flex items-center justify-center"
        >
          <X className="size-4" />
        </button>

        <div className="px-5 py-5 border-b border-subtle">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-center text-accent font-bold">
              M
            </div>
            <div>
              <div className="text-base font-semibold tracking-tight">MoovStock</div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted">
                {isAdmin ? "Espace Admin" : "Revendeur"}
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {isAdmin && (
            <>
              <div className="px-3 pt-1 pb-2 text-[10px] uppercase tracking-[0.18em] text-muted-strong">
                Administration
              </div>
              {ADMIN_ITEMS.map(renderLink)}
              <div className="my-3 border-t border-subtle/60" />
              <div className="px-3 pb-2 text-[10px] uppercase tracking-[0.18em] text-muted-strong">
                Mon activité
              </div>
            </>
          )}
          {RESELLER_ITEMS.map(renderLink)}
        </nav>

        <div className="p-3 border-t border-subtle flex items-center gap-3">
          <UserButton afterSignOutUrl="/sign-in" />
          <div className="text-sm min-w-0">
            <div className="font-medium leading-tight truncate">{userLabel}</div>
            <div className="text-xs text-muted capitalize">
              {isAdmin ? "admin" : "revendeur"}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
