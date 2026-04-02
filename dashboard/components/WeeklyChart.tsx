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
    <div className="h-64 w-full rounded-fidelity border border-border bg-surface/70 p-4">
      <p className="font-label mb-3 text-sm font-medium text-muted">
        Alerts (7 days)
      </p>
      <ResponsiveContainer width="100%" height="85%">
        <BarChart data={chartData}>
          <XAxis
            dataKey="day"
            tick={{ fill: "rgb(var(--muted))", fontSize: 11 }}
            axisLine={{ stroke: "rgb(var(--border))" }}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: "rgb(var(--muted))", fontSize: 11 }}
            axisLine={{ stroke: "rgb(var(--border))" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgb(var(--surface))",
              border: "1px solid rgb(var(--border))",
              borderRadius: "8px",
            }}
            labelStyle={{ color: "rgb(var(--foreground))" }}
          />
          <Bar
            dataKey="alerts"
            fill="rgb(var(--primary))"
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
