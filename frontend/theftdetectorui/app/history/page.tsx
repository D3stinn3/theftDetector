import { fetchHistory } from "@/lib/api";
import { alertImageUrl } from "@/lib/config";
import { ShieldAlert, Clock } from "lucide-react";

export default async function HistoryPage() {
  const rows = await fetchHistory();
  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="font-headline text-3xl font-bold tracking-tight text-foreground">Alert history</h1>
          <p className="mt-1 text-sm text-muted">Last events from SQLite.</p>
        </div>
      </header>
      {rows.length === 0 ? (
        <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.02] text-muted">
          No alerts recorded yet.
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => (
            <li key={row.id} className="group flex flex-col gap-4 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 backdrop-blur-xl transition hover:bg-white/[0.05] hover:border-white/[0.12] sm:flex-row sm:items-start">
              <div className="relative shrink-0">
                <img src={alertImageUrl(row.image_path)} alt="" className="h-28 w-40 rounded-xl border border-white/[0.08] object-cover" />
                <div className="absolute left-2 top-2 flex items-center gap-1 rounded-lg bg-black/60 px-1.5 py-0.5 backdrop-blur-sm">
                  <ShieldAlert className="h-3 w-3 text-[rgb(255,77,0)]" />
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-[rgb(255,77,0)]">Alert</span>
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground">{row.message}</p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted">
                    <Clock className="h-3 w-3" />
                    {row.timestamp}
                  </div>
                  <span className="font-mono text-[10px] text-muted/60">{row.id}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
