import { cn } from "@/lib/utils";

/**
 * Heatmap GitHub-style sur les N derniers jours.
 * `data` : map "YYYY-MM-DD" -> intensité (0..max).
 */
export function ActivityHeatmap({
  data,
  days = 35,
  max,
  label,
}: {
  data: Record<string, number>;
  days?: number;
  max?: number;
  label?: string;
}) {
  const cells: { date: string; value: number }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    cells.push({ date: key, value: data[key] ?? 0 });
  }

  const maxValue = max ?? Math.max(1, ...cells.map((c) => c.value));

  function intensity(v: number): string {
    if (v <= 0) return "bg-subtle";
    const ratio = v / maxValue;
    if (ratio < 0.25) return "bg-accent/20";
    if (ratio < 0.5)  return "bg-accent/40";
    if (ratio < 0.75) return "bg-accent/65";
    return "bg-accent";
  }

  return (
    <div>
      {label && <div className="text-xs uppercase tracking-wider text-muted mb-2">{label}</div>}
      <div className="grid grid-flow-col grid-rows-7 gap-1">
        {cells.map((c) => (
          <div
            key={c.date}
            className={cn("size-3 rounded-sm transition-colors", intensity(c.value))}
            title={`${c.date}: ${c.value}`}
          />
        ))}
      </div>
      <div className="mt-2 flex items-center gap-1 text-[10px] text-muted">
        <span>moins</span>
        <span className="size-2.5 rounded-sm bg-subtle" />
        <span className="size-2.5 rounded-sm bg-accent/20" />
        <span className="size-2.5 rounded-sm bg-accent/40" />
        <span className="size-2.5 rounded-sm bg-accent/65" />
        <span className="size-2.5 rounded-sm bg-accent" />
        <span>plus</span>
      </div>
    </div>
  );
}
