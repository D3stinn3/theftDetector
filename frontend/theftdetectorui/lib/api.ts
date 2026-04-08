import { API_BASE } from "@/lib/config";
import type {
  FaceRow,
  HistoryRow,
  TrainingArtifact,
  TrainingDataset,
  TrainingDeviceCapabilities,
  TrainingJob,
  TrainingLog,
} from "@/lib/types";

async function apiFetch<T>(path: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(`${API_BASE}${path}`, { cache: "no-store", credentials: "include" });
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}

export async function fetchStats(): Promise<{ weekly_data: number[] }> {
  return apiFetch<{ weekly_data: number[] }>("/stats", { weekly_data: [0, 0, 0, 0, 0, 0, 0] });
}

export async function fetchFaces(): Promise<FaceRow[]> {
  return apiFetch<FaceRow[]>("/faces", []);
}

export async function fetchHistory(): Promise<HistoryRow[]> {
  return apiFetch<HistoryRow[]>("/history", []);
}

export async function fetchTrainingDatasets(): Promise<TrainingDataset[]> {
  return apiFetch<TrainingDataset[]>("/training/datasets", []);
}

export async function fetchTrainingJobs(): Promise<TrainingJob[]> {
  return apiFetch<TrainingJob[]>("/training/jobs", []);
}

export async function fetchTrainingLogs(jobId: string): Promise<TrainingLog[]> {
  return apiFetch<TrainingLog[]>(`/training/jobs/${jobId}/logs`, []);
}

export async function fetchTrainingArtifacts(): Promise<TrainingArtifact[]> {
  return apiFetch<TrainingArtifact[]>("/training/artifacts", []);
}

const defaultDeviceCapabilities: TrainingDeviceCapabilities = {
  defaultDevice: "cpu",
  devices: [{ id: "cpu", label: "CPU", available: true }],
  cudaHealthy: false,
  diagnostic: null,
};

export async function fetchTrainingDevices(): Promise<TrainingDeviceCapabilities> {
  return apiFetch<TrainingDeviceCapabilities>("/training/devices", defaultDeviceCapabilities);
}
