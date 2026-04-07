// ---------------------------------------------------------------------------
// WebSocket payload types
// ---------------------------------------------------------------------------

export interface AlertPayload {
  id: string;
  message: string;
  timestamp: string;
}

export interface WsCameraFrame {
  camera_id: string;
  name: string;
  /** Base64-encoded JPEG frame */
  data: string;
}

export interface WsMultiFrame {
  type: "multi_frame";
  cameras: WsCameraFrame[];
  alert?: AlertPayload;
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export interface CameraSource {
  name: string;
  source: string;
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
  cameraSources: CameraSource[];
  activeDetectionModel: "yolov8" | "yolov26";
  /** Absolute path to promoted custom .pt for the object detector; empty = use defaults */
  activeObjectWeightsYolov8?: string;
  activeObjectWeightsYolov26?: string;
}

// ---------------------------------------------------------------------------
// Training — mirrors backend Pydantic response models (camelCase)
// ---------------------------------------------------------------------------

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
