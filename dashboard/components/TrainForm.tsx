"use client";

import { useEffect, useMemo, useState } from "react";
import { API_BASE } from "@/lib/config";
import { fetchTrainingDevices } from "@/lib/api";
import type { TrainingDataset, TrainingDeviceCapabilities } from "@/lib/types";
import { Loader2, Play } from "lucide-react";

type Props = {
  datasets: TrainingDataset[];
  selectedDatasetId: string | null;
  onRefresh: () => Promise<void>;
  onMessage: (msg: string) => void;
};

export default function TrainForm({
  datasets,
  selectedDatasetId,
  onRefresh,
  onMessage,
}: Props) {
  const [baseModel, setBaseModel] = useState("yolov8n.pt");
  const [taskType, setTaskType] = useState("detect");
  const [epochs, setEpochs] = useState(30);
  const [imgsz, setImgsz] = useState(640);
  const [batch, setBatch] = useState(8);
  const [device, setDevice] = useState("cpu");
  const [validationSplit, setValidationSplit] = useState(0.2);
  const [patience, setPatience] = useState(10);
  const [busy, setBusy] = useState(false);
  const [deviceCaps, setDeviceCaps] = useState<TrainingDeviceCapabilities>({
    defaultDevice: "cpu",
    devices: [{ id: "cpu", label: "CPU", available: true }],
    cudaHealthy: false,
    diagnostic: null,
  });

  const selectedDataset = useMemo(
    () => datasets.find((dataset) => dataset.id === selectedDatasetId) ?? null,
    [datasets, selectedDatasetId]
  );
  const selectedDatasetReady = selectedDataset?.status === "ready";
  const selectedDeviceAvailable = useMemo(
    () => deviceCaps.devices.find((item) => item.id === device)?.available ?? device === "cpu",
    [deviceCaps.devices, device]
  );

  useEffect(() => {
    let cancelled = false;
    fetchTrainingDevices().then((caps) => {
      if (cancelled) return;
      setDeviceCaps(caps);
      setDevice((prev) => {
        const currentAvailable = caps.devices.find((item) => item.id === prev)?.available;
        return currentAvailable ? prev : caps.defaultDevice;
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function startTraining() {
    if (!selectedDataset) {
      onMessage("Select a validated dataset first.");
      return;
    }
    if (!selectedDatasetReady) {
      onMessage("Validate the selected dataset and confirm it is ready before training.");
      return;
    }
    if (!selectedDeviceAvailable) {
      onMessage("The selected training device is not available in the backend runtime. Use CPU or fix CUDA first.");
      return;
    }

    setBusy(true);
    try {
      const r = await fetch(`${API_BASE}/training/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          datasetId: selectedDataset.id,
          baseModel,
          taskType,
          epochs,
          imgsz,
          batch,
          device,
          validationSplit,
          patience,
        }),
      });
      const j = await r.json();
      onMessage(j?.message ?? (r.ok ? "Training job created." : "Failed to start training."));
      if (r.ok) await onRefresh();
    } catch {
      onMessage("Network error while starting training.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-4 rounded-fidelity border border-border bg-surface/70 p-4">
      <div>
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted">
          Training configuration
        </h2>
        <p className="mt-1 text-sm text-muted">
          Launch one local background job at a time. Additional runs stay queued.
        </p>
      </div>

      <div className="rounded-fidelity border border-border bg-background px-3 py-2 text-sm text-foreground">
        Selected dataset:{" "}
        <span className="font-medium">
          {selectedDataset?.name ?? "None selected"}
        </span>
        {selectedDataset && (
          <span className="ml-2 text-xs text-muted">
            ({selectedDataset.status} • {selectedDataset.sampleCount} samples)
          </span>
        )}
      </div>

      <div className="rounded-fidelity border border-border bg-background/60 px-3 py-2 text-xs text-muted">
        Recommended first run: `yolov8n.pt`, `Object detection`, image size `640`,
        batch `8`, patience `10`, and `CPU` unless CUDA is already confirmed working.
        The validation split field is informational for pre-split YOLO datasets and
        does not currently re-split uploaded data.
      </div>

      {!deviceCaps.cudaHealthy && deviceCaps.diagnostic && (
        <div className="rounded-fidelity border border-amber-900/60 bg-amber-950/20 px-3 py-2 text-xs text-amber-200">
          GPU training is currently unavailable. {deviceCaps.diagnostic}
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <label className="space-y-1">
          <span className="text-xs text-muted">Base model</span>
          <input
            className="w-full rounded-fidelity border border-border bg-background px-3 py-2 text-sm text-foreground"
            value={baseModel}
            onChange={(e) => setBaseModel(e.target.value)}
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs text-muted">Task type</span>
          <select
            className="w-full rounded-fidelity border border-border bg-background px-3 py-2 text-sm text-foreground"
            value={taskType}
            onChange={(e) => setTaskType(e.target.value)}
          >
            <option value="detect">Object detection</option>
            <option value="classify">Classification</option>
            <option value="segment">Segmentation</option>
            <option value="pose">Pose</option>
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-xs text-muted">Epochs</span>
          <input
            type="number"
            min={1}
            className="w-full rounded-fidelity border border-border bg-background px-3 py-2 text-sm text-foreground"
            value={epochs}
            onChange={(e) => setEpochs(Number(e.target.value))}
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs text-muted">Image size</span>
          <input
            type="number"
            min={64}
            step={32}
            className="w-full rounded-fidelity border border-border bg-background px-3 py-2 text-sm text-foreground"
            value={imgsz}
            onChange={(e) => setImgsz(Number(e.target.value))}
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs text-muted">Batch size</span>
          <input
            type="number"
            min={1}
            className="w-full rounded-fidelity border border-border bg-background px-3 py-2 text-sm text-foreground"
            value={batch}
            onChange={(e) => setBatch(Number(e.target.value))}
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs text-muted">Device</span>
          <select
            className="w-full rounded-fidelity border border-border bg-background px-3 py-2 text-sm text-foreground"
            value={device}
            onChange={(e) => setDevice(e.target.value)}
          >
            {deviceCaps.devices.map((option) => (
              <option key={option.id} value={option.id} disabled={!option.available}>
                {option.label}
                {!option.available ? " (unavailable)" : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-xs text-muted">Validation split</span>
          <input
            type="number"
            min={0.05}
            max={0.5}
            step={0.05}
            className="w-full rounded-fidelity border border-border bg-background px-3 py-2 text-sm text-foreground"
            value={validationSplit}
            onChange={(e) => setValidationSplit(Number(e.target.value))}
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs text-muted">Patience</span>
          <input
            type="number"
            min={1}
            className="w-full rounded-fidelity border border-border bg-background px-3 py-2 text-sm text-foreground"
            value={patience}
            onChange={(e) => setPatience(Number(e.target.value))}
          />
        </label>
      </div>

      <button
        type="button"
        onClick={startTraining}
        disabled={busy || !selectedDataset || !selectedDatasetReady || !selectedDeviceAvailable}
        className="inline-flex items-center gap-2 rounded-fidelity bg-primary px-4 py-2 text-sm font-medium text-black hover:opacity-90 disabled:opacity-50"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
        Start training
      </button>
    </section>
  );
}
