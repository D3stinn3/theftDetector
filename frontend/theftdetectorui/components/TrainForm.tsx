"use client";

import { useEffect, useMemo, useState } from "react";
import { API_BASE } from "@/lib/config";
import { fetchTrainingDevices } from "@/lib/api";
import { inferSuggestedTrainingDefaults, suggestBatchForCpuLargeDataset } from "@/lib/training-dataset-config";
import type { TrainingDataset, TrainingDeviceCapabilities } from "@/lib/types";
import { Loader2, Play, Sparkles } from "lucide-react";

type Props = { datasets: TrainingDataset[]; selectedDatasetId: string | null; onRefresh: () => Promise<void>; onMessage: (msg: string) => void; };

export default function TrainForm({ datasets, selectedDatasetId, onRefresh, onMessage }: Props) {
  const [baseModel, setBaseModel] = useState("yolov8n.pt");
  const [taskType, setTaskType] = useState("detect");
  const [epochs, setEpochs] = useState(30);
  const [imgsz, setImgsz] = useState(640);
  const [batch, setBatch] = useState(8);
  const [device, setDevice] = useState("cpu");
  const [validationSplit, setValidationSplit] = useState(0.2);
  const [patience, setPatience] = useState(10);
  const [busy, setBusy] = useState(false);
  const [deviceCaps, setDeviceCaps] = useState<TrainingDeviceCapabilities>({ defaultDevice: "cpu", devices: [{ id: "cpu", label: "CPU", available: true }], cudaHealthy: false, diagnostic: null });
  const selectedDataset = useMemo(() => datasets.find((dataset) => dataset.id === selectedDatasetId) ?? null, [datasets, selectedDatasetId]);
  const selectedDatasetReady = selectedDataset?.status === "ready";
  const selectedDeviceAvailable = useMemo(() => deviceCaps.devices.find((item) => item.id === device)?.available ?? device === "cpu", [deviceCaps.devices, device]);
  const datasetSuggestion = useMemo(() => inferSuggestedTrainingDefaults(selectedDataset), [selectedDataset]);

  function applyDatasetDefaults() {
    if (!datasetSuggestion || !selectedDataset) return;
    setBaseModel(datasetSuggestion.baseModel);
    setTaskType(datasetSuggestion.taskType);
    const batchHint = suggestBatchForCpuLargeDataset(selectedDataset.sampleCount, device);
    if (batchHint !== null) setBatch(batchHint);
    onMessage("Applied suggested settings from the selected dataset.");
  }

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
    return () => { cancelled = true; };
  }, []);

  async function startTraining() {
    if (!selectedDataset || !selectedDatasetReady || !selectedDeviceAvailable) return;
    setBusy(true);
    try {
      const r = await fetch(`${API_BASE}/training/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ datasetId: selectedDataset.id, baseModel, taskType, epochs, imgsz, batch, device, validationSplit, patience }),
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

  const inputCls = "w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-foreground placeholder:text-muted/60 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/[0.08]";

  return (
    <section className="space-y-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-xl">
      <div><h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">Training configuration</h2><p className="mt-1 text-sm text-muted">Launch one local background job at a time. Additional runs stay queued.</p></div>
      <div className="rounded-xl border border-white/[0.06] bg-black/20 px-3 py-2 text-sm text-foreground">Selected dataset: <span className="font-medium">{selectedDataset?.name ?? "None selected"}</span></div>
      {selectedDataset && selectedDatasetReady && datasetSuggestion && (
        <div className="space-y-2 rounded-xl border border-primary/25 bg-primary/[0.06] px-3 py-3 text-xs text-muted">
          <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-medium text-foreground">Suggested from this dataset</p><button type="button" onClick={applyDatasetDefaults} className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-black/30 px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-white/[0.08]"><Sparkles className="h-3.5 w-3.5" />Apply dataset defaults</button></div>
        </div>
      )}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <label className="space-y-1"><span className="text-xs text-muted">Model family</span><select className={`${inputCls} cursor-pointer appearance-none`} value={baseModel.startsWith("yolo26") ? "yolov26" : "yolov8"} onChange={(e) => setBaseModel(e.target.value === "yolov26" ? "yolo26n.pt" : "yolov8n.pt")}><option value="yolov8">YOLOv8 (yolov8n.pt)</option><option value="yolov26">YOLOv26 (yolo26n.pt)</option></select></label>
        <label className="space-y-1"><span className="text-xs text-muted">Task type</span><select className={`${inputCls} cursor-pointer appearance-none`} value={taskType} onChange={(e) => setTaskType(e.target.value)}><option value="detect">Object detection</option><option value="classify">Classification</option><option value="segment">Segmentation</option><option value="pose">Pose</option></select></label>
        <label className="space-y-1"><span className="text-xs text-muted">Epochs</span><input type="number" min={1} className={inputCls} value={epochs} onChange={(e) => setEpochs(Number(e.target.value))} /></label>
        <label className="space-y-1"><span className="text-xs text-muted">Image size</span><input type="number" min={64} step={32} className={inputCls} value={imgsz} onChange={(e) => setImgsz(Number(e.target.value))} /></label>
        <label className="space-y-1"><span className="text-xs text-muted">Batch size</span><input type="number" min={1} className={inputCls} value={batch} onChange={(e) => setBatch(Number(e.target.value))} /></label>
        <label className="space-y-1"><span className="text-xs text-muted">Device</span><select className={`${inputCls} cursor-pointer appearance-none`} value={device} onChange={(e) => setDevice(e.target.value)}>{deviceCaps.devices.map((option) => <option key={option.id} value={option.id} disabled={!option.available}>{option.label}{!option.available ? " (unavailable)" : ""}</option>)}</select></label>
        <label className="space-y-1"><span className="text-xs text-muted">Validation split</span><input type="number" min={0.05} max={0.5} step={0.05} className={inputCls} value={validationSplit} onChange={(e) => setValidationSplit(Number(e.target.value))} /></label>
        <label className="space-y-1"><span className="text-xs text-muted">Patience</span><input type="number" min={1} className={inputCls} value={patience} onChange={(e) => setPatience(Number(e.target.value))} /></label>
      </div>
      <button type="button" onClick={startTraining} disabled={busy || !selectedDataset || !selectedDatasetReady || !selectedDeviceAvailable} className="inline-flex items-center gap-2 rounded-xl bg-[rgb(var(--accent-orange))] px-4 py-2 text-sm font-semibold text-white shadow-[0_0_20px_rgba(255,107,0,0.35)] transition hover:brightness-110 hover:shadow-[0_0_28px_rgba(255,107,0,0.5)] disabled:opacity-50 disabled:shadow-none">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}Start training</button>
    </section>
  );
}
