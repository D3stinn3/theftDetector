import LiveFeeds from "@/components/LiveFeeds";
import WeeklyChart from "@/components/WeeklyChart";
import { fetchStats } from "@/lib/api";

export default async function HomePage() {
  const stats = await fetchStats();
  const weekly = stats?.weekly_data ?? [0, 0, 0, 0, 0, 0, 0];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-headline text-2xl font-semibold tracking-tight text-foreground">
          Live surveillance
        </h1>
        <p className="mt-1 text-sm text-muted">
          WebSocket stream from the Python backend. Start{" "}
          <code className="rounded-fidelity bg-neutral/10 px-1 py-0.5 text-foreground">
            backend.py
          </code>{" "}
          first.
        </p>
      </header>

      <WeeklyChart data={weekly} />

      <section>
        <h2 className="mb-4 font-headline text-lg font-medium text-foreground">
          Camera feeds
        </h2>
        <LiveFeeds />
      </section>
    </div>
  );
}
