"use client";

import { useMemo, useState } from "react";
import { API_BASE } from "@/lib/config";
import type { TrainingArtifact, TrainingJob, TrainingLog } from "@/lib/types";
import { Loader2, Play, RefreshCw, ShieldCheck, Square } from "lucide-react";

type Props = {
  jobs: TrainingJob[];
  logs: TrainingLog[];
  artifacts: TrainingArtifact[];
  selectedJobId: string | null;
  onSelectJob: (id: string) => void;
  onRefresh: () => Promise<void>;
  onMessage: (msg: string) => void;
};

export default function TrainJobs({
  jobs,
  logs,
  artifacts,
  selectedJobId,
  onSelectJob,
  onRefresh,
  onMessage,
}: Props) {
  const [busy, setBusy] = useState<"refresh" | "cancel" | "promote" | "resume" | null>(null);

  const selectedJob = useMemo(
    () => jobs.find((job) => job.id === selectedJobId) ?? null,
    [jobs, selectedJobId]
  );

  async function cancelSelected() {
    if (!selectedJob) return;
    setBusy("cancel");
    try {
      const r = await fetch(`${API_BASE}/training/jobs/${selectedJob.id}/cancel`, { method: "POST" });
      const j = await r.json();
      onMessage(j?.message ?? (r.ok ? "Job cancelled." : "Cancel failed."));
      await onRefresh();
    } catch {
      onMessage("Network error while cancelling job.");
    } finally {
      setBusy(null);
    }
  }

  async function resumeSelected() {
    if (!selectedJob) return;
    setBusy("resume");
    try {
      const r = await fetch(`${API_BASE}/training/jobs/${selectedJob.id}/resume`, { method: "POST" });
      const j = await r.json();
      onMessage(j?.message ?? (r.ok ? "Resume job queued." : "Resume failed."));
      await onRefresh();
      if (r.ok && j?.job?.id) onSelectJob(j.job.id);
    } catch {
      onMessage("Network error while queueing resume job.");
    } finally {
      setBusy(null);
    }
  }

  async function promoteArtifact(artifactId: string) {
    setBusy("promote");
    try {
      const r = await fetch(`${API_BASE}/training/artifacts/${artifactId}/promote`, { method: "POST" });
      const j = await r.json();
      onMessage(j?.message ?? (r.ok ? "Artifact promoted." : "Promotion failed."));
      await onRefresh();
    } catch {
      onMessage("Network error while promoting artifact.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="space-y-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-xl">
      {/* Header row */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
            Training jobs
          </h2>
          <p className="mt-1 text-sm text-muted">
            Monitor queue state, progress, and logs for local training runs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={async () => { setBusy("refresh"); await onRefresh(); setBusy(null); }}
            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.15] px-3 py-2 text-sm text-foreground transition hover:bg-white/[0.06] hover:border-white/25 disabled:opacity-50"
          >
            {busy === "refresh" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </button>
          <button
            type="button"
            onClick={cancelSelected}
            disabled={
              busy !== null ||
              !selectedJob ||
              (selectedJob.status !== "queued" && selectedJob.status !== "running")
            }
            className="inline-flex items-center gap-2 rounded-xl border border-red-900/50 px-3 py-2 text-sm text-red-300 transition hover:bg-red-950/30 disabled:opacity-50"
          >
            {busy === "cancel" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Square className="h-4 w-4" />}
            Cancel selected
          </button>
          <button
            type="button"
            onClick={resumeSelected}
            disabled={
              busy !== null ||
              !selectedJob ||
              (selectedJob.status !== "cancelled" && selectedJob.status !== "failed")
            }
            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.15] px-3 py-2 text-sm text-foreground transition hover:bg-white/[0.06] hover:border-white/25 disabled:opacity-50"
          >
            {busy === "resume" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Resume selected
          </button>
        </div>
      </div>

      {jobs.length === 0 ? (
        <p className="text-sm text-muted">No training jobs yet.</p>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[1.4fr_0.9fr]">
          {/* Job list */}
          <ul className="space-y-2">
            {jobs.map((job) => {
              const selected = job.id === selectedJobId;
              return (
                <li key={job.id}>
                  <button
                    type="button"
                    onClick={() => onSelectJob(job.id)}
                    className={`w-full rounded-xl border px-4 py-3 text-left transition-all ${
                      selected
                        ? "border-primary/40 bg-primary/[0.08] shadow-[0_0_12px_rgba(255,107,0,0.1)]"
                        : "border-white/[0.06] bg-black/20 hover:bg-white/[0.04] hover:border-white/[0.10]"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-mono text-xs text-muted">{job.id}</p>
                        <p className="mt-1 text-sm text-foreground">
                          {job.status.toUpperCase()} • {job.phase}
                        </p>
                        <p className="mt-1 text-xs text-muted">
                          {job.datasetName ?? job.datasetId} • {job.baseModel} • {job.device}
                        </p>
                        {job.cancelRequested && (
                          <p className="mt-1 text-xs text-amber-300">
                            Stop requested. The trainer will halt after the current safe checkpoint.
                          </p>
                        )}
                      </div>
                      <div className="text-right text-xs text-muted">
                        <div>{Math.round((job.progress ?? 0) * 100)}%</div>
                        <div>{job.taskType}</div>
                      </div>
                    </div>
                    <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                      <div
                        className="progress-bar h-full rounded-full bg-[rgb(var(--accent-orange))]"
                        data-pct={Math.round((job.progress ?? 0) * 100)}
                      />
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Logs + artifacts */}
          <div className="space-y-4">
            {/* Job logs */}
            <div className="rounded-xl border border-white/[0.06] bg-black/20 p-4">
              <h3 className="text-sm font-medium text-foreground">Job logs</h3>
              {selectedJob ? (
                logs.length === 0 ? (
                  <p className="mt-3 text-sm text-muted">No logs yet.</p>
                ) : (
                  <div className="mt-3 max-h-72 space-y-2 overflow-auto rounded-xl border border-white/[0.06] bg-black/30 p-3">
                    {logs.map((log) => (
                      <div key={log.id} className="font-mono text-xs text-muted">
                        <span className="text-foreground">{log.level}</span> {log.ts} {log.message}
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <p className="mt-3 text-sm text-muted">Select a job to inspect logs.</p>
              )}
            </div>

            {/* Artifacts */}
            <div className="rounded-xl border border-white/[0.06] bg-black/20 p-4">
              <h3 className="text-sm font-medium text-foreground">Artifacts</h3>
              {artifacts.length === 0 ? (
                <p className="mt-3 text-sm text-muted">No artifacts yet.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {artifacts.map((artifact) => (
                    <li
                      key={artifact.id}
                      className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground">{artifact.kind}</p>
                          <p className="mt-1 break-all font-mono text-xs text-muted">
                            {artifact.path}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => promoteArtifact(artifact.id)}
                          disabled={busy !== null || artifact.promoted}
                          className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-white/[0.15] px-3 py-1.5 text-xs text-foreground transition hover:bg-white/[0.06] hover:border-white/25 disabled:opacity-50"
                        >
                          <ShieldCheck className="h-3.5 w-3.5" />
                          {artifact.promoted ? "Promoted" : "Promote"}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
