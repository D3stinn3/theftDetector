"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { API_BASE } from "@/lib/config";
import { Loader2, Trash2, Upload } from "lucide-react";

const W = 1280;
const H = 720;

export default function RoiPage() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [points, setPoints] = useState<[number, number][]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const loadRoi = useCallback(() => {
    fetch(`${API_BASE}/roi`)
      .then((r) => r.json())
      .then((data: { points?: number[][] }) => {
        const p = (data.points ?? []).map((xy) => [xy[0], xy[1]] as [number, number]);
        setPoints(p);
      })
      .catch(() => setMsg("Could not load ROI"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadRoi(); }, [loadRoi]);

  function toVideoCoords(clientX: number, clientY: number): [number, number] {
    const el = wrapRef.current;
    if (!el) return [0, 0];
    const r = el.getBoundingClientRect();
    const x = ((clientX - r.left) / r.width) * W;
    const y = ((clientY - r.top) / r.height) * H;
    return [Math.max(0, Math.min(W, Math.round(x))), Math.max(0, Math.min(H, Math.round(y)))];
  }

  function onClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    const [x, y] = toVideoCoords(e.clientX, e.clientY);
    setPoints((prev) => [...prev, [x, y]]);
  }
  function onContextMenu(e: React.MouseEvent) { e.preventDefault(); setPoints([]); }

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      const r = await fetch(`${API_BASE}/roi`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ points }),
      });
      const j = await r.json();
      setMsg(j.status === "success" ? "ROI saved to backend." : JSON.stringify(j));
    } catch {
      setMsg("Network error.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header><h1 className="font-headline text-3xl font-bold tracking-tight text-foreground">Region of interest</h1><p className="mt-1 text-sm text-muted">Click to add polygon vertices (mapped to {W}x{H}). Right-click preview to clear.</p></header>
      {msg && <p className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-foreground">{msg}</p>}
      {loading ? <div className="flex items-center gap-2 text-muted"><Loader2 className="h-5 w-5 animate-spin" />Loading ROI…</div> : <>
        <div ref={wrapRef} role="presentation" onClick={onClick} onContextMenu={onContextMenu} className="relative cursor-crosshair overflow-hidden rounded-2xl border border-white/[0.08] bg-black/40" style={{ aspectRatio: `${W} / ${H}` }}>
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent" />
          <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
            {points.length > 0 && <polygon points={points.map((p) => `${p[0]},${p[1]}`).join(" ")} fill="rgba(255, 107, 0, 0.12)" stroke="rgb(255, 107, 0)" strokeWidth="3" />}
            {points.map((p, i) => <circle key={`${p[0]},${p[1]},${i}`} cx={p[0]} cy={p[1]} r="10" fill="rgb(255, 107, 0)" stroke="rgb(10, 12, 16)" strokeWidth="2" />)}
          </svg>
          <p className="pointer-events-none absolute bottom-2 left-2 text-xs text-muted">{points.length} points</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => setPoints([])} className="inline-flex items-center gap-2 rounded-xl border border-white/[0.15] px-4 py-2 text-sm font-medium text-foreground transition hover:bg-white/[0.06] hover:border-white/25"><Trash2 className="h-4 w-4" />Clear</button>
          <button type="button" onClick={save} disabled={saving || points.length < 3} className="inline-flex items-center gap-2 rounded-xl bg-[rgb(var(--accent-orange))] px-4 py-2 text-sm font-semibold text-white shadow-[0_0_20px_rgba(255,107,0,0.35)] transition hover:brightness-110 hover:shadow-[0_0_28px_rgba(255,107,0,0.5)] disabled:opacity-40 disabled:shadow-none">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}Save polygon (min 3 points)</button>
        </div>
      </>}
    </div>
  );
}
