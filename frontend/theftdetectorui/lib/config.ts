const envBase = process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:8000";
const normalizedBase = envBase.replace(/\/$/, "");

function sanitizedApiBase(input: string): string {
  try {
    const u = new URL(input);
    // Force origin-only base so ws URL never becomes /api/ws by mistake.
    return u.origin;
  } catch {
    return "http://localhost:8000";
  }
}

export const API_BASE = sanitizedApiBase(normalizedBase);

export function getWsUrl(): string {
  const wsBase = API_BASE.replace(/^http/, "ws");
  return `${wsBase}/ws`;
}

export function alertImageUrl(imagePath: string): string {
  if (!imagePath) return "";
  const filename = imagePath.split(/[\\/]/).pop() ?? imagePath;
  return `${API_BASE}/alerts/${filename}`;
}
