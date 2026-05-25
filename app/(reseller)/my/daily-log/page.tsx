import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/PageHeader";
import { DailyLogForm } from "./DailyLogForm";
import { dateFr } from "@/lib/format";

export const dynamic = "force-dynamic";

function todayYMD(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default async function DailyLogPage() {
  const user = await requireUser();
  const today = todayYMD();
  const todayDate = new Date(today + "T00:00:00Z");

  const [todayLog, history] = await Promise.all([
    prisma.dailyLog.findUnique({
      where: { userId_date: { userId: user.id, date: todayDate } },
    }),
    prisma.dailyLog.findMany({
      where: { userId: user.id },
      orderBy: { date: "desc" },
      take: 14,
    }),
  ]);

  return (
    <>
      <PageHeader
        title="Saisie quotidienne"
        subtitle={`Ton objectif : ${user.dailyGoalItems} articles postés par jour.`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="font-medium mb-4">
            {todayLog ? "Modifier ma saisie d'aujourd'hui" : "Saisie d'aujourd'hui"}
          </h2>
          <DailyLogForm
            date={today}
            goal={user.dailyGoalItems}
            initial={todayLog ?? undefined}
          />
        </div>

        <div className="rounded-lg border border-slate-200 bg-white">
          <div className="px-4 py-3 border-b border-slate-200">
            <h2 className="font-medium">Historique 14 jours</h2>
          </div>
          {history.length === 0 ? (
            <div className="p-6 text-sm text-slate-500 text-center">Aucune saisie pour l&apos;instant.</div>
          ) : (
            <ul className="divide-y divide-slate-100 text-sm">
              {history.map((l) => {
                const hit = l.itemsListed >= user.dailyGoalItems;
                return (
                  <li key={l.id} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium">{dateFr(l.date)}</div>
                      <div className="text-xs text-slate-500">
                        {l.itemsListed} postés · {l.itemsSold} vendus
                      </div>
                    </div>
                    <span
                      className={`text-xs rounded px-2 py-0.5 font-medium ${
                        hit ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {hit ? "Objectif ✓" : `${l.itemsListed}/${user.dailyGoalItems}`}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
