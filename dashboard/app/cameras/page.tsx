"use client";

import { useEffect, useState, useCallback } from "react";
import { API_BASE } from "@/lib/config";
import { Loader2, Plus, Save, Trash2, Video } from "lucide-react";

type Cam = {
  id: string;
  name: string;
  source: string;
  status: string;
};

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
  const [startupSelected, setStartupSelected] = useState<Record<string, boolean>>(
    {}
  );
  const [reloadNow, setReloadNow] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    setMsg(null);
    Promise.all([
      fetch(`${API_BASE}/cameras`).then((r) => r.json()),
      fetch(`${API_BASE}/settings`).then((r) => r.json()),
    ])
      .then(([camsData, settings]) => {
        const nextCams: Cam[] = Array.isArray(camsData) ? camsData : [];
        setCams(nextCams);

        const cs = (settings?.cameraSources ?? []) as StartupCam[];
        const nextStartup = Array.isArray(cs) ? cs : [];
        setStartup(nextStartup);

        // Pre-check cameras that match current startup sources (by source string)
        const startupSources = new Set(nextStartup.map((c) => c.source));
        const sel: Record<string, boolean> = {};
        for (const c of nextCams) sel[c.id] = startupSources.has(c.source);
        setStartupSelected(sel);
      })
      .catch(() => setMsg("Could not load cameras/settings (is the API up?)"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function addCamera() {
    setAdding(true);
    setMsg(null);
    try {
      const r = await fetch(`${API_BASE}/cameras`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, source }),
      });
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
      const selected = cams
        .filter((c) => startupSelected[c.id])
        .map((c) => ({ name: c.name, source: c.source }));

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

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header>
        <h1 className="font-headline text-2xl font-semibold tracking-tight text-foreground">
          Cameras
        </h1>
        <p className="mt-1 text-sm text-muted">
          USB index (e.g.{" "}
          <code className="rounded-fidelity bg-neutral/10 px-1 py-0.5 text-foreground">
            0
          </code>
          ) or RTSP URL. Select which cameras should auto-load on backend startup.
        </p>
      </header>

      {msg && (
        <p className="rounded-fidelity border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-foreground">
          {msg}
        </p>
      )}

      {loading ? (
        <Loader2 className="h-6 w-6 animate-spin text-muted" />
      ) : (
        <>
          <fieldset className="space-y-3 rounded-fidelity border border-border bg-surface/70 p-4">
            <legend className="px-1 text-sm font-medium text-foreground">
              Startup cameras
            </legend>
            <p className="text-xs text-muted">
              Saved in{" "}
              <code className="rounded-fidelity bg-neutral/10 px-1 py-0.5 text-foreground">
                settings.json
              </code>{" "}
              as{" "}
              <code className="rounded-fidelity bg-neutral/10 px-1 py-0.5 text-foreground">
                cameraSources
              </code>
              .
            </p>

            {startup.length === 0 ? (
              <p className="text-sm text-muted">
                No startup cameras saved yet. Select cameras below and click
                “Save as startup cameras”.
              </p>
            ) : (
              <ul className="space-y-2">
                {startup.map((c, i) => (
                  <li
                    key={`${c.source}-${i}`}
                    className="rounded-fidelity border border-border bg-background px-3 py-2"
                  >
                    <p className="text-sm font-medium text-foreground">{c.name}</p>
                    <p className="mt-1 break-all font-mono text-xs text-muted">
                      {c.source}
                    </p>
                  </li>
                ))}
              </ul>
            )}

            <label className="flex items-center gap-3 text-sm text-foreground">
              <input
                type="checkbox"
                checked={reloadNow}
                onChange={(e) => setReloadNow(e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              Reload cameras immediately after saving
            </label>

            <button
              type="button"
              onClick={saveStartupFromSelection}
              disabled={savingStartup || cams.length === 0}
              className="inline-flex items-center gap-2 rounded-fidelity bg-primary px-4 py-2 text-sm font-medium text-black hover:opacity-90 disabled:opacity-50"
            >
              {savingStartup ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save as startup cameras
            </button>
          </fieldset>

          <ul className="space-y-2">
            {cams.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-4 rounded-fidelity border border-border bg-surface/80 px-4 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Video className="h-5 w-5 shrink-0 text-muted" />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="font-medium text-foreground">{c.name}</p>
                      <span className="text-xs text-muted">{c.status}</span>
                    </div>
                    <p className="mt-1 truncate font-mono text-xs text-muted">
                      {c.source}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-xs text-foreground">
                    <input
                      type="checkbox"
                      checked={!!startupSelected[c.id]}
                      onChange={(e) =>
                        setStartupSelected((prev) => ({
                          ...prev,
                          [c.id]: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded border-border"
                    />
                    Startup
                  </label>

                  <button
                    type="button"
                    onClick={() => remove(c.id)}
                    className="rounded-fidelity p-2 text-muted hover:bg-red-950/50 hover:text-red-400"
                    aria-label="Remove camera"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      <fieldset className="space-y-3 rounded-fidelity border border-border bg-surface/70 p-4">
        <legend className="px-1 text-sm font-medium text-foreground">
          Add camera
        </legend>
        <input
          className="w-full rounded-fidelity border border-border bg-background px-3 py-2 text-sm text-foreground"
          placeholder="Display name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="w-full rounded-fidelity border border-border bg-background px-3 py-2 text-sm font-mono text-foreground"
          placeholder="Source (0, 1, or rtsp://...)"
          value={source}
          onChange={(e) => setSource(e.target.value)}
        />
        <button
          type="button"
          onClick={addCamera}
          disabled={adding}
          className="inline-flex items-center gap-2 rounded-fidelity border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground hover:bg-neutral/15 disabled:opacity-50"
        >
          {adding ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Add
        </button>
      </fieldset>
    </div>
  );
}
