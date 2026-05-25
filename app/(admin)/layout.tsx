import { Sidebar } from "@/components/Sidebar";
import { requireAdmin } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  return (
    <div className="flex min-h-screen">
      <Sidebar variant="admin" userLabel={user.name ?? user.email} />
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
