"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE } from "@/lib/config";
import { Loader2, UserPlus } from "lucide-react";

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

  return (
    <form
      onSubmit={submit}
      className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4"
    >
      <h2 className="text-sm font-medium text-zinc-300">Register face</h2>
      {msg && (
        <p className="text-sm text-zinc-400" role="status">
          {msg}
        </p>
      )}
      <div>
        <label htmlFor="face-name" className="sr-only">
          Name
        </label>
        <input
          id="face-name"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="face-type" className="sr-only">
          List type
        </label>
        <select
          id="face-type"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
          value={type}
          onChange={(e) =>
            setType(e.target.value as "blacklist" | "whitelist")
          }
        >
          <option value="blacklist">Blacklist</option>
          <option value="whitelist">VIP / whitelist</option>
        </select>
      </div>
      <div>
        <label htmlFor="face-file" className="sr-only">
          Face photo
        </label>
        <input
          id="face-file"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="block w-full text-sm text-zinc-400 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-800 file:px-3 file:py-2 file:text-zinc-200"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </div>
      <button
        type="submit"
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-black hover:bg-amber-500 disabled:opacity-50"
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <UserPlus className="h-4 w-4" />
        )}
        Upload
      </button>
    </form>
  );
}
