"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Props = { data: number[] };

export default function WeeklyChart({ data }: Props) {
  const labels = ["-6d", "-5d", "-4d", "-3d", "-2d", "-1d", "Today"];
  const chartData = labels.map((day, i) => ({
    day,
    alerts: data[i] ?? 0,
  }));

  return (
    <div className="h-64 w-full rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
      <p className="mb-3 text-sm font-medium text-zinc-300">Alerts (7 days)</p>
      <ResponsiveContainer width="100%" height="85%">
        <BarChart data={chartData}>
          <XAxis
            dataKey="day"
            tick={{ fill: "#a1a1aa", fontSize: 11 }}
            axisLine={{ stroke: "#3f3f46" }}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: "#a1a1aa", fontSize: 11 }}
            axisLine={{ stroke: "#3f3f46" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#18181b",
              border: "1px solid #3f3f46",
              borderRadius: "8px",
            }}
            labelStyle={{ color: "#e4e4e7" }}
          />
          <Bar dataKey="alerts" fill="#f59e0b" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
