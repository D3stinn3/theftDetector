import { fetchHistory } from "@/lib/api";
import { alertImageUrl } from "@/lib/config";

export default async function HistoryPage() {
  const rows = await fetchHistory();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-white">Alert history</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Last 100 events from SQLite (images served by the API).
        </p>
      </header>

      {rows.length === 0 ? (
        <p className="text-zinc-500">No alerts recorded yet.</p>
      ) : (
        <ul className="space-y-4">
          {rows.map((row) => (
            <li
              key={row.id}
              className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 sm:flex-row sm:items-start"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={alertImageUrl(row.image_path)}
                alt=""
                className="h-36 w-auto max-w-full rounded-lg border border-zinc-700 object-cover sm:h-28 sm:w-40"
              />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-zinc-100">{row.message}</p>
                <p className="mt-1 font-mono text-xs text-zinc-500">
                  {row.timestamp}
                </p>
                <p className="mt-1 truncate text-xs text-zinc-600">{row.id}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
