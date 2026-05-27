"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const COLORS = [
  "#3fd4b3", "#34d4a8", "#60a5fa", "#a78bfa",
  "#fbbf24", "#f472b6", "#22d3ee", "#fb923c",
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
          <Pie
            data={data}
            dataKey="revenue"
            nameKey="category"
            cx="50%"
            cy="50%"
            outerRadius={90}
            label={(e: { category: string; percent?: number }) =>
              `${e.category} (${((e.percent ?? 0) * 100).toFixed(0)}%)`
            }
            labelLine={false}
            fontSize={11}
            stroke="rgb(15 21 20)"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(v: number) => `${v.toFixed(2)} €`}
            contentStyle={{
              backgroundColor: "rgb(15 21 20)",
              border: "1px solid rgb(31 44 41)",
              borderRadius: 8,
              color: "rgb(232 242 239)",
              fontSize: 12,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: "rgb(232 242 239)" }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
