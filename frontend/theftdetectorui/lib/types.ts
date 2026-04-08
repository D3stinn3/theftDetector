export interface FaceRow {
  id: string;
  name: string;
  type: "blacklist" | "whitelist";
}

export interface HistoryRow {
  id: string;
  message: string;
  timestamp: string;
  image_path: string;
}

export interface AlertPayload {
  id: string;
  message: string;
  timestamp: string;
}

export interface WsCameraFrame {
  camera_id: string;
  name: string;
  data: string;
}

export interface WsMultiFrame {
  type: "multi_frame";
  cameras: WsCameraFrame[];
  alert?: AlertPayload;
}

export interface Settings {
  emailEnabled: boolean;
  smtpServer: string;
  smtpPort: string;
  senderEmail: string;
  senderPassword: string;
  receiverEmail: string;
  telegramEnabled: boolean;
  telegramBotToken: string;
  telegramChatId: string;
  roiPoints: [number, number][];
  showHeatmap: boolean;
  cameraSources: { name: string; source: string }[];
  activeDetectionModel?: "yolov8" | "yolov26";
  activeObjectWeightsYolov8?: string;
  activeObjectWeightsYolov26?: string;
}

export interface TrainingDataset {
  id: string;
  name: string;
  sourceType: string;
  localPath: string | null;
  archivePath: string | null;
  detectedFormat: string | null;
  status: string;
  sampleCount: number;
  classCount: number;
  createdAt: string;
  notes: string | null;
  taskType: string | null;
}

export interface TrainingJob {
  id: string;
  datasetId: string;
  datasetName: string | null;
  baseModel: string;
  taskType: string;
  status: "queued" | "running" | "stopping" | "completed" | "failed" | "cancelled" | "orphaned";
  progress: number;
  phase: string;
  device: string;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  cancelRequested: boolean;
  params: Record<string, unknown> | null;
  metrics: Record<string, unknown> | null;
  error: string | null;
}

export interface TrainingArtifact {
  id: string;
  jobId: string;
  kind: string;
  path: string;
  createdAt: string;
  promoted: boolean;
  metrics: Record<string, unknown> | null;
}

export interface TrainingLog {
  id: string;
  jobId: string;
  ts: string;
  level: string;
  message: string;
}

export interface TrainingDeviceInfo {
  id: string;
  label: string;
  available: boolean;
  reason?: string | null;
}

export interface TrainingDeviceCapabilities {
  defaultDevice: string;
  devices: TrainingDeviceInfo[];
  cudaHealthy: boolean;
  diagnostic: string | null;
}
