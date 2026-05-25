"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Wallet,
  Package,
  ShoppingBag,
  ClipboardList,
  Boxes,
} from "lucide-react";

type Item = { href: string; label: string; icon: React.ComponentType<{ className?: string }> };

const ADMIN_ITEMS: Item[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/resellers", label: "Revendeurs", icon: Users },
  { href: "/finance", label: "Finance", icon: Wallet },
  { href: "/supplies", label: "Stock conso.", icon: Boxes },
];

const RESELLER_ITEMS: Item[] = [
  { href: "/my/items", label: "Mes articles", icon: Package },
  { href: "/my/sales", label: "Mes ventes", icon: ShoppingBag },
  { href: "/my/daily-log", label: "Saisie du jour", icon: ClipboardList },
];

export function Sidebar({
  variant,
  userLabel,
}: {
  variant: "admin" | "reseller";
  userLabel: string;
}) {
  const pathname = usePathname();
  const items = variant === "admin" ? ADMIN_ITEMS : RESELLER_ITEMS;

  return (
    <aside className="w-60 shrink-0 bg-white border-r border-slate-200 flex flex-col">
      <div className="px-5 py-5 border-b border-slate-200">
        <div className="text-lg font-bold text-brand">MoovStock</div>
        <div className="text-xs uppercase tracking-wider text-slate-500 mt-0.5">
          {variant === "admin" ? "Espace Admin" : "Espace Revendeur"}
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {items.map((it) => {
          const active = pathname === it.href || pathname.startsWith(it.href + "/");
          const Icon = it.icon;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition",
                active
                  ? "bg-slate-900 text-white"
                  : "text-slate-700 hover:bg-slate-100",
              )}
            >
              <Icon className="size-4" />
              {it.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-200 flex items-center gap-3">
        <UserButton afterSignOutUrl="/sign-in" />
        <div className="text-sm">
          <div className="font-medium leading-tight truncate max-w-[140px]">{userLabel}</div>
          <div className="text-xs text-slate-500 capitalize">
            {variant === "admin" ? "admin" : "revendeur"}
          </div>
        </div>
      </div>
    </aside>
  );
}
