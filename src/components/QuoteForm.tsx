"use client";

import { useState } from "react";
import { Icon } from "./Icon";

const input =
  "mt-1.5 w-full rounded-xl border border-ink-200 bg-white px-4 py-3 text-ink-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10";

export function QuoteForm({ services, initialService }: { services: string[]; initialService?: string }) {
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("busy");
    setError("");
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const res = await fetch("/api/quote", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (res.ok) setState("done");
    else {
      setState("idle");
      setError(((await res.json().catch(() => ({}))) as { error?: string }).error || "Could not send. Please call us.");
    }
  }

  if (state === "done") {
    return (
      <div className="py-10 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-green-600">
          <Icon name="check" className="h-7 w-7" strokeWidth={2.4} />
        </span>
        <h2 className="mt-4 font-display text-2xl font-bold text-ink-900">Request received</h2>
        <p className="mt-2 text-ink-500">Thank you. Our team will contact you within one working day.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-5 sm:grid-cols-2">
      <h2 className="font-display text-xl font-bold text-ink-900 sm:col-span-2">Request a quote</h2>
      <label className="text-sm font-medium text-ink-700">
        Full name
        <input name="name" required maxLength={120} autoComplete="name" className={input} />
      </label>
      <label className="text-sm font-medium text-ink-700">
        Phone
        <input name="phone" required maxLength={40} type="tel" autoComplete="tel" placeholder="+254…" className={input} />
      </label>
      <label className="text-sm font-medium text-ink-700">
        Email (optional)
        <input name="email" type="email" maxLength={160} autoComplete="email" className={input} />
      </label>
      <label className="text-sm font-medium text-ink-700">
        Service
        <select name="service" defaultValue={initialService && services.includes(initialService) ? initialService : services[0]} className={input}>
          {services.map((s) => (
            <option key={s}>{s}</option>
          ))}
          <option>Other</option>
        </select>
      </label>
      <label className="text-sm font-medium text-ink-700 sm:col-span-2">
        What do you need?
        <textarea
          name="details"
          required
          maxLength={2000}
          rows={5}
          placeholder="Goods, approximate weight/size, origin and destination, dates…"
          className={input}
        />
      </label>
      {/* Honeypot: hidden from people, filled by bots */}
      <input name="company_website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      {error && <p className="text-sm text-brand-700 sm:col-span-2">{error}</p>}
      <button
        disabled={state === "busy"}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-6 py-3.5 font-semibold text-white hover:bg-brand-600 disabled:opacity-60 sm:col-span-2 sm:justify-self-start"
      >
        {state === "busy" ? "Sending…" : "Send request"} <Icon name="arrow" className="h-4 w-4" />
      </button>
    </form>
  );
}
