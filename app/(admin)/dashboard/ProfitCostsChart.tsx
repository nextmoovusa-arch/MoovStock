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
  netProfit: number;
  stockCost: number;
  suppliesCost: number;
};

export function ProfitCostsChart({ data }: { data: Row[] }) {
  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
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
          <Legend wrapperStyle={{ fontSize: 12, color: "rgb(232 242 239)" }} />
          <Bar dataKey="stockCost" name="Achats vêtements" stackId="costs" fill="rgba(248, 113, 113, 0.75)" />
          <Bar dataKey="suppliesCost" name="Consommables" stackId="costs" fill="rgba(251, 191, 36, 0.75)" radius={[4, 4, 0, 0]} />
          <Line
            dataKey="netProfit"
            name="Profit net"
            stroke="rgb(52 211 153)"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "rgb(52 211 153)" }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
