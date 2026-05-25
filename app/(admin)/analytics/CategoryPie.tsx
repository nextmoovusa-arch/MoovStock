"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const COLORS = [
  "#0f172a", "#16a34a", "#2563eb", "#f59e0b",
  "#db2777", "#0891b2", "#7c3aed", "#dc2626",
];

type Row = { category: string; revenue: number; count: number };

export function CategoryPie({ data }: { data: Row[] }) {
  if (data.length === 0) {
    return <div className="h-64 flex items-center justify-center text-sm text-slate-500">Pas encore de ventes.</div>;
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
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(v: number) => `${v.toFixed(2)} €`} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
