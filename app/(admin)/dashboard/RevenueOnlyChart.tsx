"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
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
        <AreaChart data={data} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="rev-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(63, 212, 179)" stopOpacity={0.6} />
              <stop offset="50%" stopColor="rgb(63, 212, 179)" stopOpacity={0.18} />
              <stop offset="100%" stopColor="rgb(63, 212, 179)" stopOpacity={0} />
            </linearGradient>
            <filter id="rev-glow" x="-20%" y="-20%" width="140%" height="140%">
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
            formatter={(v: number) => [`${v.toFixed(2)} €`, "CA"]}
            cursor={{ stroke: "rgba(63, 212, 179, 0.5)", strokeDasharray: "3 3" }}
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
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="rgb(63, 212, 179)"
            strokeWidth={2.5}
            fill="url(#rev-grad)"
            isAnimationActive={true}
            animationDuration={900}
            animationEasing="ease-out"
            dot={false}
            activeDot={{
              r: 5,
              fill: "rgb(63, 212, 179)",
              stroke: "rgb(15, 21, 20)",
              strokeWidth: 2,
              filter: "url(#rev-glow)",
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
