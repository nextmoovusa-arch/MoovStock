import { Sidebar } from "@/components/Sidebar";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  const [alertsCount, debtsAgg] = await Promise.all([
    prisma.alert.count({ where: { resolvedAt: null } }),
    prisma.sale.aggregate({
      where: { paymentStatus: "PENDING" },
      _sum: { resellerPayout: true },
    }),
  ]);
  return (
    <div className="flex min-h-screen">
      <Sidebar
        variant="admin"
        userLabel={user.name ?? user.email}
        badges={{
          alerts: alertsCount,
          debts: debtsAgg._sum.resellerPayout ?? 0,
        }}
      />
      <main className="flex-1 p-4 pt-16 md:p-8 md:pt-8 min-w-0">{children}</main>
    </div>
  );
}
