import { Sidebar } from "@/components/Sidebar";
import { requireReseller } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { analyzeSupply } from "@/lib/supplies";

export default async function ResellerLayout({ children }: { children: React.ReactNode }) {
  const user = await requireReseller();

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const [todayLog, supplies] = await Promise.all([
    prisma.dailyLog.findUnique({
      where: { userId_date: { userId: user.id, date: today } },
    }),
    prisma.supply.findMany({
      where: { userId: user.id, active: true },
    }),
  ]);

  let suppliesAlert = false;
  for (const s of supplies) {
    const a = await analyzeSupply(s);
    if (a.needsRestock || a.critical) {
      suppliesAlert = true;
      break;
    }
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar
        variant="reseller"
        userLabel={user.name ?? user.email}
        badges={{ dailyLogPending: !todayLog, suppliesAlert }}
      />
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
