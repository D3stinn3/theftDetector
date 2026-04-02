import { fetchHistory } from "@/lib/api";
import { alertImageUrl } from "@/lib/config";

export default async function HistoryPage() {
  const rows = await fetchHistory();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-headline text-2xl font-semibold tracking-tight text-foreground">
          Alert history
        </h1>
        <p className="mt-1 text-sm text-muted">
          Last 100 events from SQLite (images served by the API).
        </p>
      </header>

      {rows.length === 0 ? (
        <p className="text-muted">No alerts recorded yet.</p>
      ) : (
        <ul className="space-y-4">
          {rows.map((row) => (
            <li
              key={row.id}
              className="flex flex-col gap-3 rounded-fidelity border border-border bg-surface/70 p-4 sm:flex-row sm:items-start"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={alertImageUrl(row.image_path)}
                alt=""
                className="h-36 w-auto max-w-full rounded-fidelity border border-border object-cover sm:h-28 sm:w-40"
              />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground">{row.message}</p>
                <p className="mt-1 font-mono text-xs text-muted">
                  {row.timestamp}
                </p>
                <p className="mt-1 truncate text-xs text-muted">{row.id}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
