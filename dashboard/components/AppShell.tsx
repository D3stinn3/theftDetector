"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Film,
  Video,
  MapPin,
  History,
  Settings,
  Users,
} from "lucide-react";

const nav = [
  { href: "/", label: "Live", icon: LayoutDashboard },
  { href: "/playback", label: "Playback", icon: Film },
  { href: "/roi", label: "ROI zones", icon: MapPin },
  { href: "/cameras", label: "Cameras", icon: Video },
  { href: "/history", label: "History", icon: History },
  { href: "/faces", label: "Faces", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <aside className="fixed left-0 top-0 z-40 flex h-full w-56 flex-col border-r border-zinc-800 bg-zinc-900/80 backdrop-blur-sm">
        <div className="border-b border-zinc-800 px-5 py-6">
          <p className="text-xs font-medium uppercase tracking-widest text-amber-500/90">
            Theft Guard
          </p>
          <h1 className="mt-1 text-lg font-semibold text-white">Control room</h1>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-amber-500/15 text-amber-400"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0 opacity-80" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-zinc-800 p-4 text-xs text-zinc-500">
          API{" "}
          <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-300">
            :8000
          </code>
        </div>
      </aside>
      <main className="pl-56">
        <div className="mx-auto max-w-[1600px] p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
