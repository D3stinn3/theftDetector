"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE } from "@/lib/config";
import { Loader2, UserPlus } from "lucide-react";

export default function FaceRegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [group, setGroup] = useState("blacklist");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !name.trim()) {
      setMsg("Name and image are required.");
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("name", name.trim());
      fd.append("type", group);
      const r = await fetch(`${API_BASE}/faces/register`, {
        method: "POST",
        body: fd,
      });
      const j = await r.json();
      if (j.status === "success") {
        setName("");
        setFile(null);
        setMsg(j.message ?? "Registered.");
        router.refresh();
      } else {
        setMsg(j.message ?? "Registration failed.");
      }
    } catch {
      setMsg("Network error.");
    } finally {
      setBusy(false);
    }
  }

  const inputCls =
    "w-full rounded-xl border border-white/[0.12] bg-black/30 px-4 py-3 text-sm text-foreground placeholder:text-muted/50 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/[0.10] transition";

  return (
    <form
      onSubmit={submit}
      className="glass glass-edge glass-shadow rounded-2xl px-6 py-7 space-y-6"
    >
      <h2 className="text-2xl font-bold text-foreground">Register face</h2>

      {msg && (
        <p className="text-sm text-muted" role="status">
          {msg}
        </p>
      )}

      {/* ── Name + Group row ── */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="face-name" className="block text-sm font-medium text-foreground/80">
            Name
          </label>
          <input
            id="face-name"
            className={inputCls}
            placeholder=""
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="face-group" className="block text-sm font-medium text-foreground/80">
            Group (e.g., Blacklist)
          </label>
          <input
            id="face-group"
            className={inputCls}
            placeholder="blacklist"
            value={group}
            onChange={(e) => setGroup(e.target.value)}
          />
        </div>
      </div>

      {/* ── Choose File + Upload row ── */}
      <div className="flex items-center gap-3">
        <label
          htmlFor="face-file"
          className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-white/[0.18] bg-transparent px-5 py-2.5 text-sm font-medium text-foreground transition hover:bg-white/[0.06] hover:border-white/30"
        >
          Choose File
          <input
            id="face-file"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>
        {file && (
          <span className="truncate max-w-[200px] text-xs text-muted">{file.name}</span>
        )}
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-xl bg-[rgb(var(--accent-orange))] px-7 py-2.5 text-sm font-semibold text-white shadow-[0_0_24px_rgba(255,107,0,0.45)] transition hover:brightness-110 hover:shadow-[0_0_32px_rgba(255,107,0,0.6)] disabled:opacity-50 disabled:shadow-none"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
          Upload
        </button>
      </div>
    </form>
  );
}
