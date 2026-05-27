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
      <div className="h-64 flex items-center justify-center text-sm text-muted">
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
          <CartesianGrid stroke="rgb(31 44 41)" />
          <XAxis
            type="number"
            tick={{ fontSize: 12, fill: "rgb(142 158 154)" }}
            stroke="rgb(31 44 41)"
            tickFormatter={(v: number) => `${Math.round(v)}`}
          />
          <YAxis
            dataKey="label"
            type="category"
            tick={{ fontSize: 12, fill: "rgb(142 158 154)" }}
            stroke="rgb(31 44 41)"
            width={100}
          />
          <Tooltip
            formatter={(v: number) => `${v.toFixed(2)} €`}
            cursor={{ fill: "rgba(63, 212, 179, 0.06)" }}
            contentStyle={{
              backgroundColor: "rgb(15 21 20)",
              border: "1px solid rgb(31 44 41)",
              borderRadius: 8,
              color: "rgb(232 242 239)",
              fontSize: 12,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: "rgb(232 242 239)" }} />
          <Bar dataKey="revenue" name="CA" fill="rgba(63, 212, 179, 0.85)" radius={[0, 4, 4, 0]} />
          <Bar dataKey="netProfit" name="Profit net" fill="rgb(52 211 153)" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
