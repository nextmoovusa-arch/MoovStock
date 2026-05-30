import { Sidebar } from "@/components/Sidebar";
import { ImpersonationBanner } from "@/components/ImpersonationBanner";
import { requireReseller, getImpersonationContext } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { analyzeSupply } from "@/lib/supplies";

export default async function ResellerLayout({ children }: { children: React.ReactNode }) {
  const user = await requireReseller();
  const impersonation = await getImpersonationContext();

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
      <main className="flex-1 flex flex-col min-w-0">
        {impersonation.isImpersonating && impersonation.user && (
          <ImpersonationBanner label={impersonation.user.name ?? impersonation.user.email} />
        )}
        <div className="flex-1 p-4 pt-16 md:p-8 md:pt-8 min-w-0">{children}</div>
      </main>
    </div>
  );
}
