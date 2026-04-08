const rawBase =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:8000";

export const API_BASE = rawBase;

export function getWsUrl(): string {
  const wsBase = rawBase.replace(/^http/, "ws");
  return `${wsBase}/ws`;
}

export function alertImageUrl(imagePath: string): string {
  if (!imagePath) return "";
  const filename = imagePath.split(/[\\/]/).pop() ?? imagePath;
  return `${API_BASE}/alerts/${filename}`;
}
