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
          <defs>
            <linearGradient id="bar-rev" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgb(63, 212, 179)" stopOpacity={0.4} />
              <stop offset="100%" stopColor="rgb(63, 212, 179)" stopOpacity={0.95} />
            </linearGradient>
            <linearGradient id="bar-prof" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgb(52, 211, 153)" stopOpacity={0.4} />
              <stop offset="100%" stopColor="rgb(52, 211, 153)" stopOpacity={0.95} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgb(31 44 41)" strokeDasharray="3 6" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: "rgb(142 158 154)" }}
            stroke="transparent"
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => `${Math.round(v)}`}
          />
          <YAxis
            dataKey="label"
            type="category"
            tick={{ fontSize: 11, fill: "rgb(232 242 239)" }}
            stroke="transparent"
            tickLine={false}
            axisLine={false}
            width={100}
          />
          <Tooltip
            formatter={(v: number) => `${v.toFixed(2)} €`}
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
          <Legend wrapperStyle={{ fontSize: 12, color: "rgb(232 242 239)" }} iconType="circle" />
          <Bar dataKey="revenue" name="CA" fill="url(#bar-rev)" radius={[0, 6, 6, 0]} animationDuration={800} />
          <Bar dataKey="netProfit" name="Profit net" fill="url(#bar-prof)" radius={[0, 6, 6, 0]} animationDuration={900} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
