import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/PageHeader";
import { DailyLogForm } from "./DailyLogForm";
import { ActivityHeatmap } from "@/components/ActivityHeatmap";
import { ProgressRing } from "@/components/ProgressRing";
import { dateFr } from "@/lib/format";

export const dynamic = "force-dynamic";

function todayYMD(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default async function DailyLogPage() {
  const user = await requireUser();
  const today = todayYMD();
  const todayDate = new Date(today + "T00:00:00Z");

  const since35 = new Date(Date.now() - 35 * 86400000);

  const [todayLog, history, last35] = await Promise.all([
    prisma.dailyLog.findUnique({
      where: { userId_date: { userId: user.id, date: todayDate } },
    }),
    prisma.dailyLog.findMany({
      where: { userId: user.id },
      orderBy: { date: "desc" },
      take: 14,
    }),
    prisma.dailyLog.findMany({
      where: { userId: user.id, date: { gte: since35 } },
      select: { date: true, itemsListed: true },
    }),
  ]);

  const heat: Record<string, number> = {};
  for (const l of last35) heat[ymd(new Date(l.date))] = l.itemsListed;

  const todayListed = todayLog?.itemsListed ?? 0;

  return (
    <>
      <PageHeader
        title="Saisie quotidienne"
        subtitle={`Ton objectif : ${user.dailyGoalItems} articles postés par jour.`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-subtle bg-surface p-6 animate-fade-in">
          <div className="flex items-center gap-6 mb-6">
            <ProgressRing
              value={todayListed}
              max={Math.max(user.dailyGoalItems, 1)}
              size={84}
              thickness={7}
              tone={todayListed >= user.dailyGoalItems ? "success" : "accent"}
              label={`${todayListed}`}
              sub={`/ ${user.dailyGoalItems}`}
            />
            <div>
              <h2 className="font-medium">
                {todayLog ? "Modifier ma saisie d'aujourd'hui" : "Saisie d'aujourd'hui"}
              </h2>
              <p className="text-xs text-muted mt-1">
                {todayListed >= user.dailyGoalItems
                  ? "Objectif atteint, beau travail."
                  : `Plus que ${Math.max(0, user.dailyGoalItems - todayListed)} articles à poster aujourd'hui.`}
              </p>
            </div>
          </div>

          <DailyLogForm
            date={today}
            goal={user.dailyGoalItems}
            initial={todayLog ?? undefined}
          />
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-subtle bg-surface p-5 animate-fade-in" style={{ animationDelay: "60ms" }}>
            <ActivityHeatmap data={heat} days={35} label="Activité 35 jours" />
          </div>

          <div className="rounded-xl border border-subtle bg-surface animate-fade-in" style={{ animationDelay: "120ms" }}>
            <div className="px-4 py-3 border-b border-subtle">
              <h2 className="font-medium">Historique 14 jours</h2>
            </div>
            {history.length === 0 ? (
              <div className="p-6 text-sm text-muted text-center">Aucune saisie pour l&apos;instant.</div>
            ) : (
              <ul className="divide-y divide-subtle/60 text-sm">
                {history.map((l) => {
                  const hit = l.itemsListed >= user.dailyGoalItems;
                  return (
                    <li key={l.id} className="px-4 py-3 flex items-center justify-between hover:bg-surface-2 transition-colors">
                      <div>
                        <div className="font-medium">{dateFr(l.date)}</div>
                        <div className="text-xs text-muted">
                          {l.itemsListed} postés · {l.itemsSold} vendus
                        </div>
                      </div>
                      <span
                        className={`text-xs rounded px-2 py-0.5 font-medium ${
                          hit ? "bg-success/15 text-success" : "bg-warning/15 text-warning"
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
      </div>
    </>
  );
}
