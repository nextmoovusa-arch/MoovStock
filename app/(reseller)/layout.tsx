import { Sidebar } from "@/components/Sidebar";
import { requireReseller } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function ResellerLayout({ children }: { children: React.ReactNode }) {
  const user = await requireReseller();

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const todayLog = await prisma.dailyLog.findUnique({
    where: { userId_date: { userId: user.id, date: today } },
  });

  return (
    <div className="flex min-h-screen">
      <Sidebar
        variant="reseller"
        userLabel={user.name ?? user.email}
        badges={{ dailyLogPending: !todayLog }}
      />
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
