import { cn } from "@/lib/utils";

/**
 * Anneau de progression circulaire.
 * Couleur dérivée du tone, animation via CSS transition stroke-dashoffset.
 */
export function ProgressRing({
  value,
  max,
  size = 96,
  thickness = 8,
  tone = "accent",
  label,
  sub,
}: {
  value: number;
  max: number;
  size?: number;
  thickness?: number;
  tone?: "accent" | "warning" | "danger" | "success";
  label?: string;
  sub?: string;
}) {
  const pct = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct);

  const stroke =
    tone === "warning" ? "rgb(var(--warning))" :
    tone === "danger"  ? "rgb(var(--danger))"  :
    tone === "success" ? "rgb(var(--success))" :
                         "rgb(var(--accent))";

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgb(var(--subtle))"
          strokeWidth={thickness}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={stroke}
          strokeWidth={thickness}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 800ms cubic-bezier(0.16, 1, 0.3, 1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {label && <span className={cn("text-lg font-semibold tabular-nums")}>{label}</span>}
        {sub && <span className="text-[10px] text-muted uppercase tracking-wide mt-0.5">{sub}</span>}
      </div>
    </div>
  );
}
