"use client";

import { useEffect, useState, useCallback } from "react";
import { API_BASE } from "@/lib/config";
import { Loader2, Plus, Save, Trash2, Camera, Wifi, WifiOff } from "lucide-react";

type Cam = { id: string; name: string; source: string; status: string };
type StartupCam = { name: string; source: string };

export default function CamerasPage() {
  const [cams, setCams] = useState<Cam[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("USB Camera");
  const [source, setSource] = useState("0");
  const [adding, setAdding] = useState(false);
  const [savingStartup, setSavingStartup] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [startup, setStartup] = useState<StartupCam[]>([]);
  const [startupSelected, setStartupSelected] = useState<Record<string, boolean>>({});
  const [reloadNow, setReloadNow] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    setMsg(null);
    Promise.all([fetch(`${API_BASE}/cameras`).then((r) => r.json()), fetch(`${API_BASE}/settings`).then((r) => r.json())])
      .then(([camsData, settings]) => {
        const nextCams: Cam[] = Array.isArray(camsData) ? camsData : [];
        setCams(nextCams);
        const cs = (settings?.cameraSources ?? []) as StartupCam[];
        const nextStartup = Array.isArray(cs) ? cs : [];
        setStartup(nextStartup);
        const startupSources = new Set(nextStartup.map((c) => c.source));
        const sel: Record<string, boolean> = {};
        for (const c of nextCams) sel[c.id] = startupSources.has(c.source);
        setStartupSelected(sel);
      })
      .catch(() => setMsg("Could not load cameras/settings (is the API up?)"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  async function addCamera() {
    setAdding(true);
    setMsg(null);
    try {
      const r = await fetch(`${API_BASE}/cameras`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, source }) });
      if (!r.ok) {
        const t = await r.text();
        setMsg(t || "Failed to add camera");
      } else {
        setName("Camera");
        setSource("0");
        refresh();
      }
    } catch {
      setMsg("Network error");
    } finally {
      setAdding(false);
    }
  }

  async function remove(id: string) {
    try {
      await fetch(`${API_BASE}/cameras/${id}`, { method: "DELETE" });
      refresh();
    } catch {
      setMsg("Delete failed");
    }
  }

  async function saveStartupFromSelection() {
    setSavingStartup(true);
    setMsg(null);
    try {
      const selected = cams.filter((c) => startupSelected[c.id]).map((c) => ({ name: c.name, source: c.source }));
      const r = await fetch(`${API_BASE}/cameras/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cameraSources: selected, reloadNow }),
      });
      const j = await r.json();
      setMsg(j.message ?? (r.ok ? "Saved startup cameras." : "Save failed."));
      refresh();
    } catch {
      setMsg("Network error while saving startup cameras.");
    } finally {
      setSavingStartup(false);
    }
  }

  const inputCls = "w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-foreground placeholder:text-muted/60 focus:border-[rgb(var(--accent-orange))]/50 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent-orange))]/[0.08] transition";
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight text-foreground">Cameras</h1>
        <p className="mt-1 text-sm text-muted">USB index (e.g. <code className="rounded-lg bg-white/[0.07] px-1 py-0.5 text-foreground">0</code>) or RTSP URL. Select which cameras auto-load on backend startup.</p>
      </header>
      {msg && <div className="flex items-center gap-2 rounded-xl border border-[rgb(var(--accent-orange))]/30 bg-[rgb(var(--accent-orange))]/[0.08] px-4 py-3 text-sm text-foreground"><span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[rgb(var(--accent-orange))]" />{msg}</div>}
      {loading ? (
        <div className="flex items-center gap-2 text-muted"><Loader2 className="h-5 w-5 animate-spin" /><span className="text-sm">Loading cameras…</span></div>
      ) : (
        <>
          <section className="space-y-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-xl">
            <div className="flex items-center gap-2"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[rgba(255,107,0,0.15)] ring-1 ring-[rgba(255,107,0,0.3)]"><Save className="h-4 w-4 text-[rgb(var(--accent-orange))]" /></div><div><h2 className="text-sm font-semibold text-foreground">Startup cameras</h2><p className="text-xs text-muted">Saved as <code className="rounded bg-white/[0.07] px-1 py-0.5 text-foreground">cameraSources</code> in settings.json</p></div></div>
            {startup.length === 0 ? <p className="rounded-xl border border-dashed border-white/[0.08] bg-black/10 px-4 py-3 text-sm text-muted">No startup cameras saved yet. Select cameras below and click "Save as startup cameras".</p> : <ul className="space-y-2">{startup.map((c, i) => <li key={`${c.source}-${i}`} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-black/20 px-4 py-3"><div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.05]"><Camera className="h-3.5 w-3.5 text-muted" /></div><div className="min-w-0"><p className="text-sm font-medium text-foreground">{c.name}</p><p className="mt-0.5 truncate font-mono text-xs text-muted">{c.source}</p></div></li>)}</ul>}
            <label className="flex cursor-pointer items-center gap-3 text-sm text-foreground"><input type="checkbox" checked={reloadNow} onChange={(e) => setReloadNow(e.target.checked)} className="h-4 w-4 rounded border-white/20 accent-[rgb(var(--accent-orange))]" />Reload cameras immediately after saving</label>
            <button type="button" onClick={saveStartupFromSelection} disabled={savingStartup || cams.length === 0} className="inline-flex items-center gap-2 rounded-xl bg-[rgb(var(--accent-orange))] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_20px_rgba(255,107,0,0.35)] transition hover:brightness-110 hover:shadow-[0_0_28px_rgba(255,107,0,0.5)] disabled:opacity-50 disabled:shadow-none">{savingStartup ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Save as startup cameras</button>
          </section>
          {cams.length > 0 && <ul className="space-y-2">{cams.map((c) => { const online = c.status === "open" || c.status === "running" || c.status === "active"; return <li key={c.id} className="flex items-center justify-between gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3.5 backdrop-blur-xl transition hover:bg-white/[0.05]"><div className="flex min-w-0 items-center gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] ring-1 ring-white/[0.08]"><Camera className="h-4 w-4 text-muted" /></div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-medium text-foreground">{c.name}</p><span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide" style={{ background: online ? "rgba(0,255,190,0.12)" : "rgba(110,120,145,0.15)", color: online ? "rgb(0,255,190)" : "rgb(110,120,145)", border: online ? "1px solid rgba(0,255,190,0.25)" : "1px solid rgba(110,120,145,0.2)" }}>{online ? <Wifi className="h-2.5 w-2.5" /> : <WifiOff className="h-2.5 w-2.5" />}{c.status}</span></div><p className="mt-0.5 truncate font-mono text-xs text-muted">{c.source}</p></div></div><div className="flex items-center gap-3"><label className="flex items-center gap-2 text-xs text-muted"><input type="checkbox" checked={!!startupSelected[c.id]} onChange={(e) => setStartupSelected((prev) => ({ ...prev, [c.id]: e.target.checked }))} className="h-4 w-4 rounded border-white/20 accent-[rgb(var(--accent-orange))]" />Startup</label><button type="button" onClick={() => remove(c.id)} className="rounded-xl p-2 text-muted transition hover:bg-red-950/40 hover:text-red-400" aria-label="Remove camera"><Trash2 className="h-4 w-4" /></button></div></li>; })}</ul>}
        </>
      )}
      <section className="space-y-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-xl">
        <div className="flex items-center gap-2"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[rgba(255,107,0,0.15)] ring-1 ring-[rgba(255,107,0,0.3)]"><Plus className="h-4 w-4 text-[rgb(var(--accent-orange))]" /></div><h2 className="text-sm font-semibold text-foreground">Add camera</h2></div>
        <input className={inputCls} placeholder="Display name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className={`${inputCls} font-mono`} placeholder="Source — USB index (0, 1) or rtsp://..." value={source} onChange={(e) => setSource(e.target.value)} />
        <button type="button" onClick={addCamera} disabled={adding} className="inline-flex items-center gap-2 rounded-xl border border-white/[0.15] px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-white/[0.06] hover:border-white/25 disabled:opacity-50">{adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}Add camera</button>
      </section>
    </div>
  );
}
