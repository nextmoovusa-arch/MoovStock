"use client";

import { Area, AreaChart, ResponsiveContainer } from "recharts";

/**
 * Mini sparkline pour KpiCard. Aucune axe, juste la silhouette.
 */
export function Sparkline({
  data,
  color = "rgb(63 212 179)",
  height = 36,
}: {
  data: number[];
  color?: string;
  height?: number;
}) {
  if (!data || data.length < 2) return null;
  const points = data.map((v, i) => ({ i, v }));
  const id = `spark-${color.replace(/[^a-z0-9]/gi, "")}`;
  return (
    <div className="-mx-2 -mb-2" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#${id})`}
            isAnimationActive={true}
            animationDuration={700}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
