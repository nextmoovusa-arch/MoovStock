"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

type Row = { label: string; revenue: number };

export function RevenueOnlyChart({ data }: { data: Row[] }) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="rgb(31 44 41)" />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: "rgb(142 158 154)" }} stroke="rgb(31 44 41)" />
          <YAxis
            tick={{ fontSize: 12, fill: "rgb(142 158 154)" }}
            tickFormatter={(v: number) => `${Math.round(v)} €`}
            stroke="rgb(31 44 41)"
            width={60}
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
          <Bar dataKey="revenue" name="CA" fill="rgba(63, 212, 179, 0.85)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
