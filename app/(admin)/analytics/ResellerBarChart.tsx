"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

type Row = { label: string; revenue: number; netProfit: number };

export function ResellerBarChart({ data }: { data: Row[] }) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-slate-500">
        Pas encore de ventes.
      </div>
    );
  }
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 16, bottom: 0, left: 8 }}
        >
          <CartesianGrid stroke="#f1f5f9" />
          <XAxis
            type="number"
            tick={{ fontSize: 12 }}
            tickFormatter={(v: number) => `${Math.round(v)}`}
          />
          <YAxis dataKey="label" type="category" tick={{ fontSize: 12 }} width={100} />
          <Tooltip formatter={(v: number) => `${v.toFixed(2)} €`} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="revenue" name="CA" fill="#0f172a" radius={[0, 4, 4, 0]} />
          <Bar dataKey="netProfit" name="Profit net" fill="#16a34a" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
