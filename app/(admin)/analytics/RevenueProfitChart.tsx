"use client";

import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

type Row = {
  label: string;
  revenue: number;
  netProfit: number;
};

export function RevenueProfitChart({ data }: { data: Row[] }) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="#f1f5f9" />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} />
          <YAxis
            tick={{ fontSize: 12 }}
            tickFormatter={(v: number) => `${Math.round(v)} €`}
            width={60}
          />
          <Tooltip
            formatter={(v: number) => `${v.toFixed(2)} €`}
            cursor={{ fill: "rgba(15, 23, 42, 0.04)" }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="revenue" name="CA" fill="#0f172a" radius={[4, 4, 0, 0]} />
          <Line
            dataKey="netProfit"
            name="Profit net"
            stroke="#16a34a"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
