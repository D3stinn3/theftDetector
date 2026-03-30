"use client";

import { useEffect, useMemo, useState } from "react";
import { API_BASE } from "@/lib/config";
import { Loader2, UploadCloud } from "lucide-react";

type Job = {
  id: string;
  status: "queued" | "running" | "completed" | "failed";
  progress: number;
  message: string;
  createdAt: string;
  startedAt?: string | null;
  finishedAt?: string | null;
  alertsCreated: number;
};

export default function PlaybackPage() {
  const [file, setFile] = useState<File | null>(null);
  const [sampleFps, setSampleFps] = useState(2);
  const [maxSeconds, setMaxSeconds] = useState(0);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);

  const hasActive = useMemo(
    () => jobs.some((j) => j.status === "queued" || j.status === "running"),
    [jobs]
  );

  async function refresh() {
    try {
      const r = await fetch(`${API_BASE}/playback/jobs`, { cache: "no-store" });
      const j = await r.json();
      setJobs(Array.isArray(j) ? j : []);
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    refresh();
    const t = window.setInterval(() => {
      refresh();
    }, hasActive ? 1500 : 5000);
    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasActive]);

  async function upload() {
    if (!file) {
      setMsg("Choose a video file first.");
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("sampleFps", String(sampleFps));
      fd.append("maxSeconds", String(maxSeconds));

      const r = await fetch(`${API_BASE}/playback/upload`, {
        method: "POST",
        body: fd,
      });
      const j = await r.json();
      if (!r.ok) {
        setMsg(j?.detail ?? "Upload failed.");
      } else {
        setMsg(`Uploaded. Job: ${j.jobId}`);
        setFile(null);
        refresh();
      }
    } catch {
      setMsg("Network error.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-white">Playback testing</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Upload a recorded video to test detection on CPU without live RTSP
          lag. Alerts will appear in History.
        </p>
      </header>

      {msg && (
        <p className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-300">
          {msg}
        </p>
      )}

      <section className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
        <h2 className="text-sm font-medium text-zinc-300">Upload video</h2>

        <input
          type="file"
          accept="video/*"
          aria-label="Upload video file"
          className="block w-full text-sm text-zinc-400 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-800 file:px-3 file:py-2 file:text-zinc-200"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs text-zinc-500">Sample FPS (CPU load)</span>
            <input
              type="number"
              min={0.2}
              step={0.2}
              value={sampleFps}
              onChange={(e) => setSampleFps(Number(e.target.value))}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-zinc-500">
              Max seconds (0 = full video)
            </span>
            <input
              type="number"
              min={0}
              step={1}
              value={maxSeconds}
              onChange={(e) => setMaxSeconds(Number(e.target.value))}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
            />
          </label>
        </div>

        <button
          type="button"
          onClick={upload}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-black hover:bg-amber-500 disabled:opacity-50"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <UploadCloud className="h-4 w-4" />
          )}
          Upload & analyze
        </button>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
            Jobs
          </h2>
          <button
            type="button"
            onClick={refresh}
            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-800"
          >
            Refresh
          </button>
        </div>

        {jobs.length === 0 ? (
          <p className="text-sm text-zinc-500">No jobs yet.</p>
        ) : (
          <ul className="space-y-2">
            {jobs.map((j) => (
              <li
                key={j.id}
                className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-mono text-xs text-zinc-500">{j.id}</p>
                    <p className="mt-1 text-sm text-zinc-200">
                      {j.status.toUpperCase()} • {j.message}
                    </p>
                  </div>
                  <div className="text-right text-xs text-zinc-500">
                    <div>Alerts: {j.alertsCreated}</div>
                    <div>{Math.round((j.progress ?? 0) * 100)}%</div>
                  </div>
                </div>
                <div className="mt-3 h-2 w-full overflow-hidden rounded bg-zinc-800">
                  <div
                    className="progress-bar h-full bg-amber-500"
                    data-pct={Math.round((j.progress ?? 0) * 100)}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

