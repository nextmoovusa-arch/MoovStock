"use client";

import { useEffect, useRef, useState } from "react";
import { eur } from "@/lib/format";

type FormatType = "number" | "eur" | "percent";

function formatValue(n: number, type: FormatType): string {
  if (type === "eur") return eur(n);
  if (type === "percent") return `${(n * 100).toFixed(0)} %`;
  return Math.round(n).toString();
}

/**
 * Anime un nombre depuis 0 vers `value` au mount.
 * `format` est un identifiant string (sérialisable Server → Client).
 */
export function AnimatedNumber({
  value,
  duration = 800,
  format = "number",
}: {
  value: number;
  duration?: number;
  format?: FormatType;
}) {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);

  useEffect(() => {
    const from = fromRef.current;
    const to = value;
    const start = performance.now();
    let raf = 0;

    function tick(now: number) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setDisplay(from + (to - from) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = to;
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <span className="tabular-nums">{formatValue(display, format)}</span>;
}
