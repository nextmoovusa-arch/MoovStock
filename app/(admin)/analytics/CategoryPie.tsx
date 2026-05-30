"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const COLORS = [
  "rgb(63, 212, 179)",
  "rgb(52, 211, 153)",
  "rgb(96, 165, 250)",
  "rgb(167, 139, 250)",
  "rgb(251, 191, 36)",
  "rgb(244, 114, 182)",
  "rgb(34, 211, 238)",
  "rgb(251, 146, 60)",
];

type Row = { category: string; revenue: number; count: number };

export function CategoryPie({ data }: { data: Row[] }) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-muted">
        Pas encore de ventes.
      </div>
    );
  }
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <defs>
            {COLORS.map((c, i) => (
              <linearGradient key={i} id={`cat-grad-${i}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={c} stopOpacity={1} />
                <stop offset="100%" stopColor={c} stopOpacity={0.55} />
              </linearGradient>
            ))}
          </defs>
          <Pie
            data={data}
            dataKey="revenue"
            nameKey="category"
            cx="50%"
            cy="50%"
            outerRadius={90}
            innerRadius={50}
            paddingAngle={2}
            label={(e: { category: string; percent?: number }) =>
              `${e.category} ${((e.percent ?? 0) * 100).toFixed(0)}%`
            }
            labelLine={false}
            fontSize={11}
            stroke="rgb(15 21 20)"
            strokeWidth={2}
            animationDuration={900}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={`url(#cat-grad-${i % COLORS.length})`} />
            ))}
          </Pie>
          <Tooltip
            formatter={(v: number) => `${v.toFixed(2)} €`}
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
          <Legend wrapperStyle={{ fontSize: 11, color: "rgb(232 242 239)" }} iconType="circle" />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
