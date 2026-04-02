"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import TrainDatasets from "@/components/TrainDatasets";
import TrainForm from "@/components/TrainForm";
import TrainJobs from "@/components/TrainJobs";
import {
  fetchTrainingArtifacts,
  fetchTrainingDatasets,
  fetchTrainingJobs,
  fetchTrainingLogs,
} from "@/lib/api";
import type { TrainingArtifact, TrainingDataset, TrainingJob, TrainingLog } from "@/lib/types";

export default function TrainPage() {
  const [datasets, setDatasets] = useState<TrainingDataset[]>([]);
  const [jobs, setJobs] = useState<TrainingJob[]>([]);
  const [artifacts, setArtifacts] = useState<TrainingArtifact[]>([]);
  const [logs, setLogs] = useState<TrainingLog[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const hasActiveJob = useMemo(
    () => jobs.some((job) => job.status === "queued" || job.status === "running"),
    [jobs]
  );

  const refresh = useCallback(async () => {
    const [nextDatasets, nextJobs, nextArtifacts] = await Promise.all([
      fetchTrainingDatasets(),
      fetchTrainingJobs(),
      fetchTrainingArtifacts(),
    ]);

    setDatasets(nextDatasets);
    setJobs(nextJobs);
    setArtifacts(nextArtifacts);

    setSelectedDatasetId((prev) =>
      prev && nextDatasets.some((dataset) => dataset.id === prev)
        ? prev
        : (nextDatasets[0]?.id ?? null)
    );

    setSelectedJobId((prev) =>
      prev && nextJobs.some((job) => job.id === prev) ? prev : (nextJobs[0]?.id ?? null)
    );
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      refresh();
    }, hasActiveJob ? 3000 : 5000);
    return () => window.clearInterval(interval);
  }, [hasActiveJob, refresh]);

  useEffect(() => {
    if (!selectedJobId) {
      setLogs([]);
      return;
    }

    let cancelled = false;

    async function loadLogs() {
      const nextLogs = await fetchTrainingLogs(selectedJobId);
      if (!cancelled) setLogs(nextLogs);
    }

    loadLogs();
    const interval = window.setInterval(loadLogs, hasActiveJob ? 3000 : 6000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [selectedJobId, hasActiveJob]);

  return (
    <div className="space-y-8">
      <header className="max-w-4xl">
        <h1 className="font-headline text-2xl font-semibold tracking-tight text-foreground">
          Train
        </h1>
        <p className="mt-1 text-sm text-muted">
          Ingest datasets, start local background training jobs, inspect logs, and
          promote saved artifacts when they are ready for testing.
        </p>
      </header>

      {msg && (
        <p className="max-w-4xl rounded-fidelity border border-border bg-surface px-3 py-2 text-sm text-foreground">
          {msg}
        </p>
      )}

      <TrainDatasets
        datasets={datasets}
        selectedDatasetId={selectedDatasetId}
        onSelectDataset={setSelectedDatasetId}
        onRefresh={refresh}
        onMessage={setMsg}
      />

      <TrainForm
        datasets={datasets}
        selectedDatasetId={selectedDatasetId}
        onRefresh={refresh}
        onMessage={setMsg}
      />

      <TrainJobs
        jobs={jobs}
        logs={logs}
        artifacts={artifacts}
        selectedJobId={selectedJobId}
        onSelectJob={setSelectedJobId}
        onRefresh={refresh}
        onMessage={setMsg}
      />
    </div>
  );
}
