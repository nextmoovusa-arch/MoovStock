import { cn } from "@/lib/utils";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative rounded-xl border border-dashed border-subtle bg-surface overflow-hidden",
        "p-12 text-center animate-fade-in",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-accent/10 to-transparent" />
      {icon && (
        <div className="relative inline-flex size-12 items-center justify-center rounded-full bg-accent/10 border border-accent/20 text-accent mb-4 animate-float">
          {icon}
        </div>
      )}
      <div className="relative font-medium">{title}</div>
      {description && <p className="relative text-sm text-muted mt-1.5 max-w-md mx-auto">{description}</p>}
      {action && <div className="relative mt-5 flex justify-center">{action}</div>}
    </div>
  );
}
