import { fetchFaces } from "@/lib/api";
import FaceRegisterForm from "@/components/FaceRegisterForm";
import { Bell, Search, Sparkles, UserRound } from "lucide-react";

export default async function FacesPage() {
  const faces = await fetchFaces();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="glass glass-edge glass-shadow rounded-fidelity px-6 py-5">
        <div className="grid grid-cols-[1fr_minmax(0,28rem)_1fr] items-start gap-4">
          <div />
          <div className="text-center">
            <h1 className="font-headline text-2xl font-semibold tracking-tight text-foreground">
              Face registry
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Blacklist / VIP encodings stored in the backend database (requires{" "}
              <code className="rounded-fidelity bg-neutral/10 px-1 py-0.5 text-foreground">
                face_recognition
              </code>
              ).
            </p>
          </div>
          <div className="flex items-center justify-end gap-2 pt-0.5">
            <button
              type="button"
              aria-label="Search"
              className="inline-flex h-10 w-10 items-center justify-center rounded-fidelity bg-white/5 text-foreground/85 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-foreground"
            >
              <Search className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </button>
            <button
              type="button"
              aria-label="Notifications"
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-fidelity bg-white/5 text-foreground/85 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-foreground"
            >
              <Bell className="h-[18px] w-[18px]" strokeWidth={1.75} />
              <span className="absolute right-2 top-2 dot-orange" />
            </button>
            <button
              type="button"
              aria-label="Profile"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[rgb(var(--accent-orange)/0.22)] text-[rgb(var(--accent-orange))] ring-1 ring-[rgb(var(--accent-orange)/0.35)] transition hover:bg-[rgb(var(--accent-orange)/0.30)]"
            >
              <UserRound className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </header>

      <FaceRegisterForm />

      <section className="relative overflow-hidden rounded-fidelity glass glass-edge glass-shadow">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[2px] bg-gradient-to-r from-transparent via-[rgb(var(--accent-orange))] to-transparent opacity-80 shadow-[0_0_12px_rgba(249,115,22,0.35)]"
          aria-hidden
        />
        <div className="relative bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.05)_1px,transparent_0)] [background-size:20px_20px] px-6 pb-10 pt-6">
          <h2 className="text-sm font-semibold text-foreground">Registered</h2>
          {faces.length === 0 ? (
            <div className="relative grid min-h-[220px] place-items-center px-4 py-12">
              <p className="text-base font-medium text-foreground/90">
                No faces yet.
              </p>
              <Sparkles
                className="pointer-events-none absolute bottom-4 right-4 h-5 w-5 text-orange-400/80"
                strokeWidth={1.5}
                aria-hidden
              />
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {faces.map((f) => (
                <li
                  key={f.id}
                  className="flex items-center justify-between py-3 text-sm first:pt-0"
                >
                  <span className="font-medium text-foreground">{f.name}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      f.type === "blacklist"
                        ? "bg-red-950/80 text-red-300"
                        : "bg-secondary/30 text-foreground"
                    }`}
                  >
                    {f.type}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
