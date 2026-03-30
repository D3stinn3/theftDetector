import LiveFeeds from "@/components/LiveFeeds";
import WeeklyChart from "@/components/WeeklyChart";
import { fetchStats } from "@/lib/api";

export default async function HomePage() {
  const stats = await fetchStats();
  const weekly = stats?.weekly_data ?? [0, 0, 0, 0, 0, 0, 0];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          Live surveillance
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          WebSocket stream from the Python backend. Start{" "}
          <code className="rounded bg-zinc-800 px-1 py-0.5 text-zinc-300">
            backend.py
          </code>{" "}
          first.
        </p>
      </header>

      <WeeklyChart data={weekly} />

      <section>
        <h2 className="mb-4 text-lg font-medium text-zinc-200">Camera feeds</h2>
        <LiveFeeds />
      </section>
    </div>
  );
}
