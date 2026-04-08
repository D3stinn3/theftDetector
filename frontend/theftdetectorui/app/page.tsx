import { fetchStats } from "@/lib/api";
import LiveFeeds from "@/components/LiveFeeds";
import WeeklyChart from "@/components/WeeklyChart";
import { Activity, AlertTriangle, TrendingUp, Cctv } from "lucide-react";

export default async function Home() {
  const stats = await fetchStats();
  const weekly = stats?.weekly_data ?? [0, 0, 0, 0, 0, 0, 0];
  const totalAlerts = weekly.reduce((a: number, b: number) => a + b, 0);
  const todayAlerts = weekly[weekly.length - 1] ?? 0;
  const yesterdayAlerts = weekly[weekly.length - 2] ?? 0;
  const trend = todayAlerts - yesterdayAlerts;

  const statCards = [
    {
      label: "Alerts today",
      value: todayAlerts,
      icon: AlertTriangle,
      color: "rgba(255,77,0,0.15)",
      ring: "rgba(255,77,0,0.35)",
      iconColor: "rgb(255,77,0)",
      glow: "0 0 20px rgba(255,77,0,0.2)",
    },
    {
      label: "7-day total",
      value: totalAlerts,
      icon: Activity,
      color: "rgba(255,107,0,0.15)",
      ring: "rgba(255,107,0,0.35)",
      iconColor: "rgb(var(--accent-orange))",
      glow: "0 0 20px rgba(255,107,0,0.2)",
    },
    {
      label: "Trend vs yesterday",
      value: trend >= 0 ? `+${trend}` : `${trend}`,
      icon: TrendingUp,
      color: trend > 0 ? "rgba(255,77,0,0.15)" : "rgba(0,255,190,0.1)",
      ring: trend > 0 ? "rgba(255,77,0,0.35)" : "rgba(0,255,190,0.3)",
      iconColor: trend > 0 ? "rgb(255,77,0)" : "rgb(0,255,190)",
      glow: trend > 0 ? "0 0 20px rgba(255,77,0,0.15)" : "0 0 20px rgba(0,255,190,0.1)",
    },
    {
      label: "Live streams",
      value: "—",
      icon: Cctv,
      color: "rgba(0,255,190,0.1)",
      ring: "rgba(0,255,190,0.3)",
      iconColor: "rgb(0,255,190)",
      glow: "0 0 20px rgba(0,255,190,0.1)",
    },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight text-foreground">
          Live surveillance
        </h1>
      </header>
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {statCards.map(({ label, value, icon: Icon, color, ring, iconColor, glow }) => (
          <div
            key={label}
            className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-xl transition hover:bg-white/[0.05]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">{value}</p>
              </div>
              <div
                style={{ background: color, boxShadow: glow, border: `1px solid ${ring}` }}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              >
                <Icon style={{ width: 18, height: 18, color: iconColor }} strokeWidth={1.75} />
              </div>
            </div>
          </div>
        ))}
      </div>
      <WeeklyChart data={weekly} />
      <section>
        <h2 className="mb-4 font-headline text-lg font-semibold tracking-wide text-foreground">
          Camera feeds
        </h2>
        <LiveFeeds />
      </section>
    </div>
  );
}
