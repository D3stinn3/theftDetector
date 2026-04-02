"use client";

import { useEffect, useState } from "react";
import { API_BASE } from "@/lib/config";
import type { Settings } from "@/lib/types";
import { Loader2, Save, Send } from "lucide-react";

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
        Loading settings…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <header>
        <h1 className="font-headline text-2xl font-semibold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="mt-1 text-sm text-muted">
          Email, Telegram, and display options. ROI is edited on the ROI page.
        </p>
      </header>

      {msg && (
        <p className="rounded-fidelity border border-border bg-surface px-3 py-2 text-sm text-foreground">
          {msg}
        </p>
      )}

      <label className="flex cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          checked={s.showHeatmap}
          onChange={(e) => setS({ ...s, showHeatmap: e.target.checked })}
          className="h-4 w-4 rounded border-border"
        />
        <span className="text-sm text-foreground">Show heatmap overlay</span>
      </label>

      <fieldset className="space-y-4 rounded-fidelity border border-border bg-surface/70 p-4">
        <legend className="px-1 text-sm font-medium text-foreground">Email</legend>
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={s.emailEnabled}
            onChange={(e) => setS({ ...s, emailEnabled: e.target.checked })}
            className="h-4 w-4 rounded border-border"
          />
          <span className="text-sm text-foreground">Enable email alerts</span>
        </label>
        <input
          className="w-full rounded-fidelity border border-border bg-background px-3 py-2 text-sm text-foreground"
          placeholder="SMTP server"
          value={s.smtpServer}
          onChange={(e) => setS({ ...s, smtpServer: e.target.value })}
        />
        <input
          className="w-full rounded-fidelity border border-border bg-background px-3 py-2 text-sm text-foreground"
          placeholder="SMTP port"
          value={s.smtpPort}
          onChange={(e) => setS({ ...s, smtpPort: e.target.value })}
        />
        <input
          className="w-full rounded-fidelity border border-border bg-background px-3 py-2 text-sm text-foreground"
          placeholder="Sender email"
          value={s.senderEmail}
          onChange={(e) => setS({ ...s, senderEmail: e.target.value })}
        />
        <input
          type="password"
          className="w-full rounded-fidelity border border-border bg-background px-3 py-2 text-sm text-foreground"
          placeholder="Sender password / app password"
          value={s.senderPassword}
          onChange={(e) => setS({ ...s, senderPassword: e.target.value })}
        />
        <input
          className="w-full rounded-fidelity border border-border bg-background px-3 py-2 text-sm text-foreground"
          placeholder="Receiver email"
          value={s.receiverEmail}
          onChange={(e) => setS({ ...s, receiverEmail: e.target.value })}
        />
      </fieldset>

      <fieldset className="space-y-4 rounded-fidelity border border-border bg-surface/70 p-4">
        <legend className="px-1 text-sm font-medium text-foreground">
          Telegram
        </legend>
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={s.telegramEnabled}
            onChange={(e) => setS({ ...s, telegramEnabled: e.target.checked })}
            className="h-4 w-4 rounded border-border"
          />
          <span className="text-sm text-foreground">Enable Telegram alerts</span>
        </label>
        <input
          className="w-full rounded-fidelity border border-border bg-background px-3 py-2 text-sm text-foreground"
          placeholder="Bot token"
          value={s.telegramBotToken}
          onChange={(e) => setS({ ...s, telegramBotToken: e.target.value })}
        />
        <input
          className="w-full rounded-fidelity border border-border bg-background px-3 py-2 text-sm text-foreground"
          placeholder="Chat ID"
          value={s.telegramChatId}
          onChange={(e) => setS({ ...s, telegramChatId: e.target.value })}
        />
      </fieldset>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-fidelity bg-primary px-4 py-2 text-sm font-medium text-black hover:opacity-90 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save
        </button>
        <button
          type="button"
          onClick={testNotifications}
          disabled={testing}
          className="inline-flex items-center gap-2 rounded-fidelity border border-border px-4 py-2 text-sm text-foreground hover:bg-neutral/15 disabled:opacity-50"
        >
          {testing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Test notifications
        </button>
      </div>
    </div>
  );
}
