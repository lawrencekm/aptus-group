"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "./Icon";

export function TrackForm({ dark = false, autoFocus = false }: { dark?: boolean; autoFocus?: boolean }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const clean = code.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (clean.length < 6) {
      setError("Enter the tracking code from your receipt or SMS.");
      return;
    }
    setError("");
    setBusy(true);
    router.push(`/t/${clean}`);
  }

  return (
    <form onSubmit={submit} className="w-full" role="search" aria-label="Track a shipment">
      <label htmlFor="track-code" className={`mb-2 block text-sm font-medium ${dark ? "text-ink-200" : "text-ink-700"}`}>
        Tracking code
      </label>
      <div className={`flex flex-col gap-2 rounded-2xl p-2 sm:flex-row ${dark ? "bg-white/10 ring-1 ring-white/15" : "bg-white ring-1 ring-ink-200 shadow-sm"}`}>
        <div className="flex flex-1 items-center gap-2 px-3">
          <Icon name="search" className={`h-5 w-5 ${dark ? "text-ink-200" : "text-ink-400"}`} />
          <input
            id="track-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoFocus={autoFocus}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            placeholder="e.g. K7QM29XDPA"
            className={`h-12 w-full bg-transparent font-mono text-lg tracking-widest uppercase outline-none ${
              dark ? "text-white placeholder:text-ink-400" : "text-ink-900 placeholder:text-ink-400"
            }`}
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-500 px-6 font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60"
        >
          {busy ? "Checking…" : "Track"} <Icon name="arrow" className="h-4 w-4" />
        </button>
      </div>
      {error && <p className={`mt-2 text-sm ${dark ? "text-brand-100" : "text-brand-700"}`}>{error}</p>}
    </form>
  );
}
