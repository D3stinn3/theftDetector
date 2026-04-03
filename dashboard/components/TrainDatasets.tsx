"use client";

import { useMemo, useState } from "react";
import { API_BASE } from "@/lib/config";
import type { TrainingDataset } from "@/lib/types";
import { FolderSearch, Loader2, UploadCloud } from "lucide-react";

type Props = {
  datasets: TrainingDataset[];
  selectedDatasetId: string | null;
  onSelectDataset: (id: string) => void;
  onRefresh: () => Promise<void>;
  onMessage: (msg: string) => void;
};

export default function TrainDatasets({
  datasets,
  selectedDatasetId,
  onSelectDataset,
  onRefresh,
  onMessage,
}: Props) {
  const [datasetFile, setDatasetFile] = useState<File | null>(null);
  const [datasetName, setDatasetName] = useState("");
  const [taskType, setTaskType] = useState("detect");
  const [notes, setNotes] = useState("");
  const [localPath, setLocalPath] = useState("");
  const [busy, setBusy] = useState<"upload" | "path" | "validate" | null>(null);

  const selectedDataset = useMemo(
    () => datasets.find((dataset) => dataset.id === selectedDatasetId) ?? null,
    [datasets, selectedDatasetId]
  );

  async function uploadDataset() {
    if (!datasetFile) { onMessage("Choose a dataset archive first."); return; }
    setBusy("upload");
    try {
      const fd = new FormData();
      fd.append("file", datasetFile);
      fd.append("name", datasetName || datasetFile.name.replace(/\.[^.]+$/, ""));
      fd.append("taskType", taskType);
      fd.append("notes", notes);
      const r = await fetch(`${API_BASE}/training/datasets/upload`, {
        method: "POST",
        body: fd,
      });
      const j = await r.json();
      if (!r.ok) { onMessage(j?.detail ?? "Upload failed."); return; }
      onMessage(`Dataset uploaded: ${j.name}`);
      setDatasetFile(null);
      setDatasetName("");
      setNotes("");
      await onRefresh();
      if (j.id) onSelectDataset(j.id);
    } catch {
      onMessage("Network error while uploading dataset.");
    } finally {
      setBusy(null);
    }
  }

  async function registerPath() {
    if (!localPath.trim()) { onMessage("Enter a local dataset path."); return; }
    setBusy("path");
    try {
      const r = await fetch(`${API_BASE}/training/datasets/register-path`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: localPath.trim(),
          name: datasetName || localPath.trim().split("/").filter(Boolean).pop() || "Dataset",
          taskType,
          notes,
        }),
      });
      const j = await r.json();
      if (!r.ok) { onMessage(j?.detail ?? "Path registration failed."); return; }
      onMessage(`Dataset registered: ${j.name}`);
      await onRefresh();
      if (j.id) onSelectDataset(j.id);
    } catch {
      onMessage("Network error while registering dataset path.");
    } finally {
      setBusy(null);
    }
  }

  async function validateSelected() {
    if (!selectedDataset) { onMessage("Select a dataset to validate."); return; }
    setBusy("validate");
    try {
      const r = await fetch(`${API_BASE}/training/datasets/${selectedDataset.id}/validate`, {
        method: "POST",
      });
      const j = await r.json();
      onMessage(j?.message ?? (r.ok ? "Validation finished." : "Validation failed."));
      await onRefresh();
    } catch {
      onMessage("Network error while validating dataset.");
    } finally {
      setBusy(null);
    }
  }

  const inputCls =
    "w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-foreground placeholder:text-muted/60 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/[0.08]";

  return (
    <section className="space-y-6 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-xl">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
          Datasets
        </h2>
        <p className="mt-1 text-sm text-muted">
          Upload an archive or register an existing local path, then validate it
          before training.
        </p>
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-xs text-muted">
          <li>Upload an archive or register a backend-local dataset path.</li>
          <li>Select the dataset from the list below.</li>
          <li>Click "Validate selected" and wait for "ready" with a non-zero sample count.</li>
          <li>Only then start a training job from the configuration form.</li>
        </ol>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upload archive */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-foreground">Upload archive</h3>
          <input
            type="file"
            accept=".zip,.tar,.gz,.tgz,.yaml,.yml"
            className="block w-full text-sm text-muted file:mr-3 file:rounded-xl file:border-0 file:bg-white/[0.08] file:px-3 file:py-2 file:text-sm file:text-foreground hover:file:bg-white/[0.12]"
            onChange={(e) => setDatasetFile(e.target.files?.[0] ?? null)}
          />
          <input
            className={inputCls}
            placeholder="Dataset name"
            value={datasetName}
            onChange={(e) => setDatasetName(e.target.value)}
          />
          <select
            className={`${inputCls} cursor-pointer appearance-none`}
            value={taskType}
            onChange={(e) => setTaskType(e.target.value)}
          >
            <option value="detect">Object detection</option>
            <option value="classify">Classification</option>
            <option value="segment">Segmentation</option>
            <option value="pose">Pose</option>
          </select>
          <textarea
            className={`${inputCls} min-h-24 resize-y`}
            placeholder="Notes about this dataset"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <button
            type="button"
            onClick={uploadDataset}
            disabled={busy !== null}
            className="inline-flex items-center gap-2 rounded-xl bg-[rgb(var(--accent-orange))] px-4 py-2 text-sm font-semibold text-white shadow-[0_0_20px_rgba(255,107,0,0.35)] transition hover:brightness-110 hover:shadow-[0_0_28px_rgba(255,107,0,0.5)] disabled:opacity-50 disabled:shadow-none"
          >
            {busy === "upload" ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
            Upload dataset
          </button>
        </div>

        {/* Register local path */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-foreground">Register local path</h3>
          <input
            className={`${inputCls} font-mono`}
            placeholder="/absolute/path/to/dataset"
            value={localPath}
            onChange={(e) => setLocalPath(e.target.value)}
          />
          <p className="text-xs text-muted">
            Use this when the dataset already exists on the same machine as the backend.
          </p>
          <p className="text-xs text-muted">
            Expected YOLO layout: dataset root with <code className="rounded-lg bg-white/[0.07] px-1">data.yaml</code>,
            plus <code className="rounded-lg bg-white/[0.07] px-1">train/images</code>,{" "}
            <code className="rounded-lg bg-white/[0.07] px-1">train/labels</code>,{" "}
            <code className="rounded-lg bg-white/[0.07] px-1">valid/images</code>, and{" "}
            <code className="rounded-lg bg-white/[0.07] px-1">valid/labels</code>.
          </p>
          <button
            type="button"
            onClick={registerPath}
            disabled={busy !== null}
            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.15] px-4 py-2 text-sm font-medium text-foreground transition hover:bg-white/[0.06] hover:border-white/25 disabled:opacity-50"
          >
            {busy === "path" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderSearch className="h-4 w-4" />}
            Register path
          </button>
        </div>
      </div>

      {/* Dataset list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">Available datasets</h3>
          <button
            type="button"
            onClick={validateSelected}
            disabled={busy !== null || !selectedDataset}
            className="rounded-xl border border-white/[0.15] px-3 py-1.5 text-xs text-foreground transition hover:bg-white/[0.06] hover:border-white/25 disabled:opacity-50"
          >
            {busy === "validate" ? "Validating…" : "Validate selected"}
          </button>
        </div>

        {datasets.length === 0 ? (
          <p className="text-sm text-muted">No datasets registered yet.</p>
        ) : (
          <ul className="space-y-2">
            {datasets.map((dataset) => {
              const selected = dataset.id === selectedDatasetId;
              return (
                <li key={dataset.id}>
                  <button
                    type="button"
                    onClick={() => onSelectDataset(dataset.id)}
                    className={`w-full rounded-xl border px-4 py-3 text-left transition-all ${
                      selected
                        ? "border-primary/40 bg-primary/[0.08] shadow-[0_0_12px_rgba(255,107,0,0.1)]"
                        : "border-white/[0.06] bg-black/20 hover:bg-white/[0.04] hover:border-white/[0.10]"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{dataset.name}</p>
                        <p className="mt-1 text-xs text-muted">
                          {dataset.status} • {dataset.detectedFormat ?? "unknown format"} •{" "}
                          {dataset.taskType ?? "unknown task"}
                        </p>
                        {selected && dataset.status !== "ready" && (
                          <p className="mt-2 text-xs text-amber-300">
                            Validate this dataset before training. Broken YOLO split paths
                            will fail validation and should be fixed or re-imported.
                          </p>
                        )}
                      </div>
                      <div className="text-right text-xs text-muted">
                        <div>{dataset.sampleCount} samples</div>
                        <div>{dataset.classCount} classes</div>
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
