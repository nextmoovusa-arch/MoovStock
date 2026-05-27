import { cn } from "@/lib/utils";

/**
 * Petit point pulsant pour signaler une activité / alerte en temps réel.
 */
export function LiveDot({
  tone = "danger",
  size = 8,
  className,
}: {
  tone?: "danger" | "warning" | "success" | "accent";
  size?: number;
  className?: string;
}) {
  const cls =
    tone === "danger"  ? "bg-danger"  :
    tone === "warning" ? "bg-warning" :
    tone === "success" ? "bg-success" :
                          "bg-accent";

  return (
    <span className={cn("relative inline-flex", className)} style={{ width: size, height: size }}>
      <span
        className={cn("absolute inset-0 rounded-full opacity-60 animate-ping", cls)}
      />
      <span className={cn("relative rounded-full", cls)} style={{ width: size, height: size }} />
    </span>
  );
}
