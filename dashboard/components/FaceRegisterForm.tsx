"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE } from "@/lib/config";
import { ChevronDown, Loader2, UserPlus } from "lucide-react";

export default function FaceRegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [type, setType] = useState<"blacklist" | "whitelist">("blacklist");
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
      fd.append("type", type);
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

  const inputClass =
    "w-full rounded-fidelity border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-foreground placeholder:text-muted ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent-orange)/0.40)]";

  return (
    <form
      onSubmit={submit}
      className="glass glass-edge glass-shadow space-y-5 rounded-fidelity px-6 py-6"
    >
      <h2 className="text-sm font-semibold text-foreground">Register face</h2>
      {msg && (
        <p className="text-sm text-muted" role="status">
          {msg}
        </p>
      )}

      {/* Row 1: Name + category (matches reference layout) */}
      <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
        <div>
          <label
            htmlFor="face-name"
            className="mb-1.5 block text-xs font-medium text-muted"
          >
            Name
          </label>
          <input
            id="face-name"
            className={inputClass}
            placeholder=""
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label
            htmlFor="face-type"
            className="mb-1.5 block text-xs font-medium text-muted"
          >
            Category
          </label>
          <div className="relative">
            <select
              id="face-type"
              className={`${inputClass} cursor-pointer pr-10`}
              value={type}
              onChange={(e) =>
                setType(e.target.value as "blacklist" | "whitelist")
              }
            >
              <option value="blacklist">Blacklist</option>
              <option value="whitelist">VIP / whitelist</option>
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
              aria-hidden
            />
          </div>
        </div>
      </div>

      {/* Row 2: file picker + Upload (same row as reference) */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <label
            htmlFor="face-file"
            className="mb-1.5 block text-xs font-medium text-muted sm:sr-only"
          >
            Photo
          </label>
          <input
            id="face-file"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="block w-full min-w-0 text-sm text-muted/90 file:mr-3 file:rounded-fidelity file:border-0 file:bg-white/10 file:px-4 file:py-2.5 file:text-sm file:font-medium file:text-foreground file:ring-1 file:ring-white/10 hover:file:bg-white/15"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-fidelity bg-[rgb(var(--accent-orange))] px-8 py-2.5 text-sm font-semibold text-black ring-1 ring-[rgb(var(--accent-orange)/0.40)] shadow-[0_0_24px_rgba(249,115,22,0.45)] transition hover:brightness-105 hover:shadow-[0_0_28px_rgba(249,115,22,0.55)] disabled:opacity-50 disabled:shadow-none sm:min-w-[7.5rem]"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <UserPlus className="h-4 w-4" />
          )}
          Upload
        </button>
      </div>
    </form>
  );
}
