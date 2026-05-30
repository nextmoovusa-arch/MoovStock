"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";

type Row = { label: string; count?: number; value?: number };

/**
 * Bar chart générique vertical (pour histogrammes, jours de semaine, etc.).
 * `valueKey` = "count" par défaut ; passer "value" si tu mets un montant.
 */
export function BarHistogram({
  data,
  valueKey = "count",
  valueLabel = "Nombre",
  color = "rgb(63, 212, 179)",
  height = 240,
  formatValue,
  highlightMax = true,
}: {
  data: Row[];
  valueKey?: "count" | "value";
  valueLabel?: string;
  color?: string;
  height?: number;
  formatValue?: (v: number) => string;
  highlightMax?: boolean;
}) {
  const maxV = Math.max(...data.map((d) => Number(d[valueKey] ?? 0)));

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={`bh-grad-${color.replace(/[^a-z0-9]/gi, "")}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.9} />
              <stop offset="100%" stopColor={color} stopOpacity={0.35} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgb(31 44 41)" strokeDasharray="3 6" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "rgb(142 158 154)" }}
            stroke="transparent"
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "rgb(142 158 154)" }}
            stroke="transparent"
            tickLine={false}
            axisLine={false}
            width={40}
            tickFormatter={(v: number) => (formatValue ? formatValue(v) : String(Math.round(v)))}
          />
          <Tooltip
            formatter={(v: number) => [
              formatValue ? formatValue(v) : v.toString(),
              valueLabel,
            ]}
            cursor={{ fill: "rgba(63, 212, 179, 0.06)" }}
            contentStyle={{
              backgroundColor: "rgba(15, 21, 20, 0.95)",
              border: "1px solid rgba(63, 212, 179, 0.3)",
              borderRadius: 10,
              color: "rgb(232 242 239)",
              fontSize: 12,
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
              backdropFilter: "blur(8px)",
            }}
          />
          <Bar
            dataKey={valueKey}
            fill={`url(#bh-grad-${color.replace(/[^a-z0-9]/gi, "")})`}
            radius={[6, 6, 0, 0]}
            animationDuration={700}
          >
            {data.map((d, i) => {
              const v = Number(d[valueKey] ?? 0);
              const isMax = highlightMax && v === maxV && maxV > 0;
              return (
                <Cell
                  key={i}
                  fill={isMax ? color : `url(#bh-grad-${color.replace(/[^a-z0-9]/gi, "")})`}
                />
              );
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
