import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="glass glass-edge glass-shadow rounded-fidelity px-6 py-8">
        <h1 className="font-headline text-2xl font-semibold tracking-tight text-foreground">
          Page not found
        </h1>
        <p className="mt-2 text-sm text-muted">
          That route doesn’t exist in the dashboard.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-fidelity bg-primary px-4 py-2 text-sm font-semibold text-black hover:opacity-90"
          >
            Go to Live
          </Link>
          <Link
            href="/faces"
            className="inline-flex items-center gap-2 rounded-fidelity border border-border bg-neutral/10 px-4 py-2 text-sm font-medium text-foreground hover:bg-neutral/15"
          >
            Face registry
          </Link>
        </div>
      </div>
    </div>
  );
}

