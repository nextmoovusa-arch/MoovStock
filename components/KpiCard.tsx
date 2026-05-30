import { cn } from "@/lib/utils";
import { Sparkline } from "./Sparkline";
import { AnimatedNumber } from "./AnimatedNumber";
import { eur } from "@/lib/format";

type FormatType = "number" | "eur" | "percent";

function formatValue(n: number, type: FormatType): string {
  if (type === "eur") return eur(n);
  if (type === "percent") return `${(n * 100).toFixed(0)} %`;
  return Math.round(n).toString();
}

/**
 * KpiCard (Server Component).
 * - `value` (string)  → affiché tel quel
 * - `animateValue` (number) → compteur animé via AnimatedNumber (Client).
 *   La mise en forme est faite côté Client à partir de `format` (string,
 *   pas fonction — Server → Client interdit pour les fonctions).
 */
export function KpiCard({
  label,
  value,
  hint,
  tone = "default",
  spark,
  delay = 0,
  animateValue,
  format = "number",
}: {
  label: string;
  value?: string;
  hint?: string;
  tone?: "default" | "positive" | "negative" | "warning";
  spark?: number[];
  delay?: number;
  animateValue?: number;
  format?: FormatType;
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
        {animateValue !== undefined ? (
          <AnimatedNumber value={animateValue} format={format} />
        ) : (
          value
        )}
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

export { formatValue };
