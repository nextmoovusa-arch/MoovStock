import { Sidebar } from "@/components/Sidebar";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  const alertsCount = await prisma.alert.count({ where: { resolvedAt: null } });
  return (
    <div className="flex min-h-screen">
      <Sidebar
        variant="admin"
        userLabel={user.name ?? user.email}
        badges={{ alerts: alertsCount }}
      />
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
