"use client";

import { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "success";
type Size = "sm" | "md";

const VARIANT: Record<Variant, string> = {
  primary:
    "bg-accent text-on-accent hover:bg-accent-strong shadow-sm hover:shadow-glow active:scale-[0.98]",
  secondary:
    "bg-surface-2 text-foreground border border-subtle hover:bg-subtle active:scale-[0.98]",
  ghost:
    "text-muted hover:text-foreground hover:bg-surface-2",
  danger:
    "bg-danger/15 text-danger border border-danger/30 hover:bg-danger/25 active:scale-[0.98]",
  success:
    "bg-success text-on-accent hover:opacity-90 active:scale-[0.98]",
};

const SIZE: Record<Size, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-9 px-4 text-sm",
};

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = "primary", size = "md", loading, iconLeft, iconRight, className, children, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-medium",
        "transition-[transform,background-color,box-shadow,opacity] duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
        VARIANT[variant],
        SIZE[size],
        className,
      )}
      {...rest}
    >
      {loading ? <Loader2 className="size-3.5 animate-spin" /> : iconLeft}
      {children}
      {!loading && iconRight}
    </button>
  );
});
