import type { TrainingJob } from "./types";

const FINISHED_STATUSES: TrainingJob["status"][] = ["completed", "failed", "cancelled"];

function sortKeyFinished(job: TrainingJob): number {
  if (job.finishedAt) {
    const t = Date.parse(job.finishedAt);
    if (Number.isFinite(t)) return t;
  }
  if (job.createdAt) {
    const t = Date.parse(job.createdAt);
    if (Number.isFinite(t)) return t;
  }
  return 0;
}

export function getLatestFinishedJobId(jobs: TrainingJob[]): string | null {
  const eligible = jobs.filter((j) => FINISHED_STATUSES.includes(j.status));
  if (eligible.length === 0) return null;
  const sorted = [...eligible].sort((a, b) => sortKeyFinished(b) - sortKeyFinished(a));
  return sorted[0]?.id ?? null;
}
