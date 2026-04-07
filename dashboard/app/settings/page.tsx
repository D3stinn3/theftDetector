"use client";

import { useEffect, useState } from "react";
import { API_BASE } from "@/lib/config";
import type { Settings } from "@/lib/types";
import { Loader2, Save, Send, Mail, MessageSquare, Eye, Cpu } from "lucide-react";

const empty: Settings = {
  emailEnabled: false,
  smtpServer: "smtp.gmail.com",
  smtpPort: "587",
  senderEmail: "",
  senderPassword: "",
  receiverEmail: "",
  telegramEnabled: false,
  telegramBotToken: "",
  telegramChatId: "",
  roiPoints: [],
  showHeatmap: true,
  cameraSources: [],
  activeDetectionModel: "yolov8",
  activeObjectWeightsYolov8: "",
  activeObjectWeightsYolov26: "",
};

export default function SettingsPage() {
  const [s, setS] = useState<Settings>(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/settings`)
      .then((r) => r.json())
      .then((data: Settings) => setS({ ...empty, ...data }))
      .catch(() => setMsg("Could not load settings (is the API up?)"))
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      const r = await fetch(`${API_BASE}/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(s),
      });
      const j = await r.json();
      setMsg(j.message ?? (r.ok ? "Saved." : "Save failed."));
    } catch {
      setMsg("Network error.");
    } finally {
      setSaving(false);
    }
  }

  async function testNotifications() {
    setTesting(true);
    setMsg(null);
    try {
      const r = await fetch(`${API_BASE}/settings/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(s),
      });
      const j = await r.json();
      setMsg(j.message ?? JSON.stringify(j));
    } catch {
      setMsg("Network error.");
    } finally {
      setTesting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">Loading settings…</span>
      </div>
    );
  }

  const inputCls =
    "w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-foreground placeholder:text-muted/60 focus:border-[rgb(var(--accent-orange))]/50 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent-orange))]/[0.08] transition";

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="mt-1 text-sm text-muted">
          Email, Telegram, and display options. ROI is edited on the ROI page.
        </p>
      </header>

      {msg && (
        <div className="flex items-center gap-2 rounded-xl border border-[rgb(var(--accent-orange))]/30 bg-[rgb(var(--accent-orange))]/[0.08] px-4 py-3 text-sm text-foreground">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[rgb(var(--accent-orange))]" />
          {msg}
        </div>
      )}

      {/* ── Display ── */}
      <section className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-xl">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[rgba(255,107,0,0.15)] ring-1 ring-[rgba(255,107,0,0.3)]">
            <Eye className="h-4 w-4 text-[rgb(var(--accent-orange))]" />
          </div>
          <h2 className="text-sm font-semibold text-foreground">Display</h2>
        </div>
        <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-black/20 px-4 py-3">
          <span className="text-sm text-foreground">Show heatmap overlay</span>
          <input
            type="checkbox"
            checked={s.showHeatmap}
            onChange={(e) => setS({ ...s, showHeatmap: e.target.checked })}
            className="h-4 w-4 rounded border-white/20 accent-[rgb(var(--accent-orange))]"
          />
        </label>
      </section>

      {/* ── Detection Model ── */}
      <section className="space-y-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[rgba(255,107,0,0.15)] ring-1 ring-[rgba(255,107,0,0.3)]">
            <Cpu className="h-4 w-4 text-[rgb(var(--accent-orange))]" />
          </div>
          <h2 className="text-sm font-semibold text-foreground">Detection model</h2>
        </div>
        <p className="text-xs text-muted">
          Applies to live surveillance and playback analysis. Changes take effect on the next detection cycle.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {(["yolov8", "yolov26"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setS({ ...s, activeDetectionModel: m })}
              className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
                s.activeDetectionModel === m
                  ? "border-[rgb(var(--accent-orange))]/60 bg-[rgb(var(--accent-orange))]/10 text-foreground shadow-[0_0_12px_rgba(255,107,0,0.2)]"
                  : "border-white/[0.08] bg-black/20 text-muted hover:border-white/20 hover:text-foreground"
              }`}
            >
              {m === "yolov8" ? "YOLOv8" : "YOLOv26"}
              <span className="ml-2 text-xs opacity-60">
                {m === "yolov8" ? "yolov8n.pt" : "yolo26n.pt"}
              </span>
            </button>
          ))}
        </div>
        <p className="text-xs text-muted">
          Custom object weights (from Train → Promote) override the default detector for that family. Clear the field to use bundled weights again.
        </p>
        <label className="block space-y-1">
          <span className="text-xs text-muted">YOLOv8 — custom object .pt path</span>
          <input
            className={inputCls}
            placeholder="Leave empty for default"
            value={s.activeObjectWeightsYolov8 ?? ""}
            onChange={(e) => setS({ ...s, activeObjectWeightsYolov8: e.target.value })}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs text-muted">YOLOv26 — custom object .pt path</span>
          <input
            className={inputCls}
            placeholder="Leave empty for default"
            value={s.activeObjectWeightsYolov26 ?? ""}
            onChange={(e) => setS({ ...s, activeObjectWeightsYolov26: e.target.value })}
          />
        </label>
      </section>

      {/* ── Email ── */}
      <section className="space-y-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[rgba(255,107,0,0.15)] ring-1 ring-[rgba(255,107,0,0.3)]">
              <Mail className="h-4 w-4 text-[rgb(var(--accent-orange))]" />
            </div>
            <h2 className="text-sm font-semibold text-foreground">Email alerts</h2>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-xs text-muted">
            <input
              type="checkbox"
              checked={s.emailEnabled}
              onChange={(e) => setS({ ...s, emailEnabled: e.target.checked })}
              className="h-4 w-4 rounded border-white/20 accent-[rgb(var(--accent-orange))]"
            />
            Enable
          </label>
        </div>
        <input className={inputCls} placeholder="SMTP server" value={s.smtpServer} onChange={(e) => setS({ ...s, smtpServer: e.target.value })} />
        <input className={inputCls} placeholder="SMTP port" value={s.smtpPort} onChange={(e) => setS({ ...s, smtpPort: e.target.value })} />
        <input className={inputCls} placeholder="Sender email" value={s.senderEmail} onChange={(e) => setS({ ...s, senderEmail: e.target.value })} />
        <input type="password" className={inputCls} placeholder="Sender password / app password" value={s.senderPassword} onChange={(e) => setS({ ...s, senderPassword: e.target.value })} />
        <input className={inputCls} placeholder="Receiver email" value={s.receiverEmail} onChange={(e) => setS({ ...s, receiverEmail: e.target.value })} />
      </section>

      {/* ── Telegram ── */}
      <section className="space-y-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[rgba(255,107,0,0.15)] ring-1 ring-[rgba(255,107,0,0.3)]">
              <MessageSquare className="h-4 w-4 text-[rgb(var(--accent-orange))]" />
            </div>
            <h2 className="text-sm font-semibold text-foreground">Telegram alerts</h2>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-xs text-muted">
            <input
              type="checkbox"
              checked={s.telegramEnabled}
              onChange={(e) => setS({ ...s, telegramEnabled: e.target.checked })}
              className="h-4 w-4 rounded border-white/20 accent-[rgb(var(--accent-orange))]"
            />
            Enable
          </label>
        </div>
        <input className={inputCls} placeholder="Bot token" value={s.telegramBotToken} onChange={(e) => setS({ ...s, telegramBotToken: e.target.value })} />
        <input className={inputCls} placeholder="Chat ID" value={s.telegramChatId} onChange={(e) => setS({ ...s, telegramChatId: e.target.value })} />
      </section>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-[rgb(var(--accent-orange))] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_0_20px_rgba(255,107,0,0.35)] transition hover:brightness-110 hover:shadow-[0_0_28px_rgba(255,107,0,0.5)] disabled:opacity-50 disabled:shadow-none"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save settings
        </button>
        <button
          type="button"
          onClick={testNotifications}
          disabled={testing}
          className="inline-flex items-center gap-2 rounded-xl border border-white/[0.15] px-5 py-2.5 text-sm font-medium text-foreground transition hover:bg-white/[0.06] hover:border-white/25 disabled:opacity-50"
        >
          {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Test notifications
        </button>
      </div>
    </div>
  );
}
