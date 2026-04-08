import type { TrainingDataset } from "./types";

const VALID_TASKS = new Set(["detect", "classify", "segment", "pose"]);

export type SuggestedTrainingDefaults = {
  baseModel: string;
  taskType: string;
  warnings: string[];
  rationale: string[];
};

export function inferSuggestedTrainingDefaults(dataset: TrainingDataset | null): SuggestedTrainingDefaults | null {
  if (!dataset || dataset.status !== "ready") return null;
  const warnings: string[] = [];
  const rationale: string[] = [];
  if (dataset.detectedFormat && dataset.detectedFormat !== "yolo") {
    warnings.push(`Format is "${dataset.detectedFormat}" - trainer expects YOLO-style dataset.`);
  }
  const haystack = `${dataset.name} ${dataset.notes ?? ""}`.toLowerCase();
  const prefersYolo26 = /\byolov?26\b/.test(haystack) || /\byolo26\b/.test(haystack) || /\bv26\b/.test(haystack) || haystack.includes("yolo26");
  const baseModel = prefersYolo26 ? "yolo26n.pt" : "yolov8n.pt";
  rationale.push(prefersYolo26 ? "Model family inferred from dataset metadata (YOLOv26 heuristic)." : "Default model family: YOLOv8n.");
  let taskType = "detect";
  const rawTask = (dataset.taskType ?? "").toLowerCase().trim();
  if (rawTask && VALID_TASKS.has(rawTask)) {
    taskType = rawTask;
    rationale.push(`Task type from dataset metadata (${rawTask}).`);
  }
  return { baseModel, taskType, warnings, rationale };
}

export function suggestBatchForCpuLargeDataset(sampleCount: number, device: string): number | null {
  if (device !== "cpu") return null;
  if (sampleCount >= 2000) return 4;
  if (sampleCount >= 800) return 6;
  return null;
}
