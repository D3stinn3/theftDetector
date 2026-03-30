import { fetchFaces } from "@/lib/api";
import FaceRegisterForm from "@/components/FaceRegisterForm";

export default async function FacesPage() {
  const faces = await fetchFaces();

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-white">Face registry</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Blacklist / VIP encodings stored in the backend database (requires{" "}
          <code className="text-zinc-300">face_recognition</code>).
        </p>
      </header>

      <FaceRegisterForm />

      <div>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-500">
          Registered
        </h2>
        {faces.length === 0 ? (
          <p className="text-zinc-500">No faces yet.</p>
        ) : (
          <ul className="divide-y divide-zinc-800 rounded-xl border border-zinc-800">
            {faces.map((f) => (
              <li
                key={f.id}
                className="flex items-center justify-between px-4 py-3 text-sm"
              >
                <span className="font-medium text-zinc-200">{f.name}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    f.type === "blacklist"
                      ? "bg-red-950 text-red-300"
                      : "bg-emerald-950 text-emerald-300"
                  }`}
                >
                  {f.type}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
