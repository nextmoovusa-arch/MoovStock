import { cn } from "@/lib/utils";
import { Sparkline } from "./Sparkline";

export function KpiCard({
  label,
  value,
  hint,
  tone = "default",
  spark,
  delay = 0,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "positive" | "negative" | "warning";
  spark?: number[];
  delay?: number;
}) {
  const sparkColor =
    tone === "positive" ? "rgb(52 211 153)" :
    tone === "negative" ? "rgb(248 113 113)" :
    tone === "warning"  ? "rgb(251 191 36)"  :
                          "rgb(63 212 179)";

  return (
    <div
      className="relative rounded-xl border border-subtle bg-surface p-4 overflow-hidden card-hover animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
      <div className="text-[11px] uppercase tracking-wider text-muted">{label}</div>
      <div
        className={cn(
          "mt-2 text-2xl font-semibold tabular-nums",
          tone === "positive" && "text-success",
          tone === "negative" && "text-danger",
          tone === "warning" && "text-warning",
          tone === "default" && "text-foreground",
        )}
      >
        {value}
      </div>
      {hint && <div className="mt-1 text-xs text-muted">{hint}</div>}
      {spark && spark.length >= 2 && (
        <div className="mt-3">
          <Sparkline data={spark} color={sparkColor} />
        </div>
      )}
    </div>
  );
}
