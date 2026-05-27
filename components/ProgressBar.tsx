import { cn } from "@/lib/utils";

export function ProgressBar({
  value,
  max,
  tone = "accent",
  showLabel = false,
  className,
}: {
  value: number;
  max: number;
  tone?: "accent" | "warning" | "danger" | "success";
  showLabel?: boolean;
  className?: string;
}) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  const bar =
    tone === "warning" ? "bg-warning" :
    tone === "danger"  ? "bg-danger"  :
    tone === "success" ? "bg-success" :
                         "bg-accent";

  return (
    <div className={cn("w-full", className)}>
      <div className="h-1.5 rounded-full bg-subtle overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-[width] duration-700 ease-out", bar)}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <div className="mt-1 flex justify-between text-[10px] text-muted tabular-nums">
          <span>{value}</span>
          <span>{max}</span>
        </div>
      )}
    </div>
  );
}
