import { fetchFaces } from "@/lib/api";
import FaceRegisterForm from "@/components/FaceRegisterForm";
import { Bell, Users, UserRound, User } from "lucide-react";

export default async function FacesPage() {
  const faces = await fetchFaces();

  return (
    <div className="space-y-6">
      {/* ── Page header row ── */}
      <div className="flex items-center justify-between">
        <h1 className="font-headline text-4xl font-bold tracking-tight text-foreground">
          Face Registry
        </h1>
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="All faces"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.05] text-foreground/80 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-foreground"
          >
            <Users className="h-5 w-5" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            aria-label="Notifications"
            className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.05] text-foreground/80 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-foreground"
          >
            <Bell className="h-5 w-5" strokeWidth={1.75} />
            <span className="absolute right-2.5 top-2.5 dot-orange" />
          </button>
          <button
            type="button"
            aria-label="Profile"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[rgba(255,107,0,0.18)] text-[rgb(var(--accent-orange))] ring-1 ring-[rgba(255,107,0,0.35)] transition hover:bg-[rgba(255,107,0,0.28)]"
          >
            <UserRound className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </div>
      </div>

      {/* ── Register face card ── */}
      <FaceRegisterForm />

      {/* ── Registered faces grid ── */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Registered</h2>

        {faces.length === 0 ? (
          <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.02] text-muted">
            No faces registered yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {faces.map((f) => (
              <div
                key={f.id}
                className="relative flex items-center gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4 backdrop-blur-xl transition hover:bg-white/[0.07]"
              >
                {/* Orange badge — top-right */}
                <div className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-[rgba(255,107,0,0.18)] ring-1 ring-[rgba(255,107,0,0.35)]">
                  <UserRound className="h-3.5 w-3.5 text-[rgb(var(--accent-orange))]" />
                </div>

                {/* Avatar circle */}
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/[0.08] ring-1 ring-white/[0.10]">
                  <User className="h-7 w-7 text-muted" strokeWidth={1.5} />
                </div>

                {/* Info */}
                <div className="min-w-0 pr-8">
                  <p className="truncate font-semibold text-foreground">{f.name}</p>
                  <p className="mt-0.5 text-sm capitalize text-muted">{f.type}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
