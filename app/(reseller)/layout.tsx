import { Sidebar } from "@/components/Sidebar";
import { requireReseller } from "@/lib/auth";

export default async function ResellerLayout({ children }: { children: React.ReactNode }) {
  const user = await requireReseller();
  return (
    <div className="flex min-h-screen">
      <Sidebar variant="reseller" userLabel={user.name ?? user.email} />
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
