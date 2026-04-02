"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Film,
  BrainCircuit,
  Video,
  MapPin,
  History,
  Settings,
  Users,
  Shield,
} from "lucide-react";

const nav = [
  { href: "/", label: "Live", icon: LayoutDashboard },
  { href: "/playback", label: "Playback", icon: Film },
  { href: "/train", label: "Train", icon: BrainCircuit },
  { href: "/roi", label: "ROI zones", icon: MapPin },
  { href: "/cameras", label: "Cameras", icon: Video },
  { href: "/history", label: "History", icon: History },
  { href: "/faces", label: "Faces", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <div className="app-bg" />

      <aside className="glass glass-edge glass-shadow fixed left-0 top-0 z-40 flex h-full w-56 flex-col border-r border-border/60 bg-transparent">
        <div className="border-b border-border/60 px-5 py-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-fidelity bg-[rgb(var(--accent-orange)/0.18)] ring-1 ring-[rgb(var(--accent-orange)/0.35)]">
              <Shield className="h-5 w-5 text-[rgb(var(--accent-orange))]" aria-hidden />
            </div>
            <div>
              <p className="font-headline text-base font-semibold leading-tight tracking-tight text-foreground">
                Theft Guard AI
              </p>
              <p className="font-label mt-0.5 text-[10px] font-medium uppercase tracking-widest text-muted">
                Control room
              </p>
            </div>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {nav.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
            const facesActive = active && href === "/faces";
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-fidelity px-3 py-2.5 text-sm font-medium transition-colors ${
                  facesActive
                    ? "bg-[rgb(var(--accent-orange)/0.14)] text-foreground glow-faces ring-1 ring-[rgb(var(--accent-orange)/0.22)]"
                    : active
                      ? "bg-primary/15 text-primary"
                      : "text-muted hover:bg-neutral/10 hover:text-foreground"
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 ${
                    facesActive ? "text-[rgb(var(--accent-orange))]" : "opacity-80"
                  }`}
                />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border/60 p-4 text-xs text-muted">
          API{" "}
          <code className="rounded-fidelity bg-neutral/10 px-1.5 py-0.5 text-foreground">
            :8000
          </code>
        </div>
      </aside>
      <main className="relative z-10 pl-56">
        <div className="mx-auto max-w-[1600px] p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
