"use client";

import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
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
          <defs>
            <linearGradient id="profit-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(52, 211, 153)" stopOpacity={0.4} />
              <stop offset="100%" stopColor="rgb(52, 211, 153)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="stock-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(248, 113, 113)" stopOpacity={0.9} />
              <stop offset="100%" stopColor="rgb(248, 113, 113)" stopOpacity={0.4} />
            </linearGradient>
            <linearGradient id="supplies-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(251, 191, 36)" stopOpacity={0.9} />
              <stop offset="100%" stopColor="rgb(251, 191, 36)" stopOpacity={0.4} />
            </linearGradient>
            <filter id="profit-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
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
            tickFormatter={(v: number) => `${Math.round(v)} €`}
            stroke="transparent"
            tickLine={false}
            axisLine={false}
            width={60}
          />
          <Tooltip
            formatter={(v: number, name: string) => [`${v.toFixed(2)} €`, name]}
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
            labelStyle={{ color: "rgb(142 158 154)", marginBottom: 4 }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, color: "rgb(232 242 239)", paddingTop: 8 }}
            iconType="circle"
          />
          <Bar
            dataKey="stockCost"
            name="Achats vêtements"
            stackId="costs"
            fill="url(#stock-grad)"
            radius={[0, 0, 0, 0]}
            animationDuration={800}
          />
          <Bar
            dataKey="suppliesCost"
            name="Consommables"
            stackId="costs"
            fill="url(#supplies-grad)"
            radius={[6, 6, 0, 0]}
            animationDuration={800}
          />
          <Area
            type="monotone"
            dataKey="netProfit"
            name="Profit net"
            stroke="rgb(52, 211, 153)"
            strokeWidth={2.5}
            fill="url(#profit-grad)"
            isAnimationActive={true}
            animationDuration={1000}
            animationEasing="ease-out"
            dot={false}
            activeDot={{
              r: 5,
              fill: "rgb(52, 211, 153)",
              stroke: "rgb(15, 21, 20)",
              strokeWidth: 2,
              filter: "url(#profit-glow)",
            }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
