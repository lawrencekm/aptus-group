"use client";

import { useState } from "react";
import { Icon } from "./Icon";
import { RequestDone } from "./RequestDone";
import { useBotCheck } from "./useBotCheck";

const input =
  "mt-1.5 w-full rounded-xl border border-ink-200 bg-white px-4 py-3 text-ink-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10";

type Done = { ref: string; receiptUrl: string; emailed: boolean };

/** Shared submit logic for the public forms: bot proof + JSON POST. */
function useSubmit(endpoint: string) {
  const getToken = useBotCheck();
  const [state, setState] = useState<"idle" | "busy">("idle");
  const [error, setError] = useState("");
  const [done, setDone] = useState<Done | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setState("busy");
    setError("");
    try {
      const data = Object.fromEntries(new FormData(form)) as Record<string, string>;
      const token = await getToken();
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, ...token }),
      });
      const d = (await res.json().catch(() => ({}))) as { error?: string; ref?: string; receiptUrl?: string };
      if (!res.ok) throw new Error(d.error || "Could not send. Please call us.");
      if (d.ref && d.receiptUrl) {
        setDone({ ref: d.ref, receiptUrl: d.receiptUrl, emailed: !!data.email });
        form.reset();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send. Please call us.");
    } finally {
      setState("idle");
    }
  }
  return { submit, state, error, done, reset: () => setDone(null) };
}

function Honeypot() {
  // Hidden from people (and screen readers); bots that fill every field get caught.
  return (
    <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
      <label>
        Company website
        <input name="company_website" tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  );
}

function SubmitRow({ busy, label, error }: { busy: boolean; label: string; error: string }) {
  return (
    <>
      {error && <p role="alert" className="text-sm text-brand-700 sm:col-span-2">{error}</p>}
      <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:items-center">
        <button disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-6 py-3.5 font-semibold text-white hover:bg-brand-600 disabled:opacity-60">
          {busy ? "Sending…" : label} <Icon name="arrow" className="h-4 w-4" />
        </button>
        <p className="flex items-center gap-1.5 text-xs text-ink-400">
          <Icon name="shield" className="h-3.5 w-3.5" /> Protected against spam. You&apos;ll get a PDF receipt.
        </p>
      </div>
    </>
  );
}

export function QuoteForm({ services, initialService }: { services: string[]; initialService?: string }) {
  const { submit, state, error, done, reset } = useSubmit("/api/quote");
  if (done) return <RequestDone refNo={done.ref} receiptUrl={done.receiptUrl} emailed={done.emailed} onAnother={reset} />;

  return (
    <form onSubmit={submit} className="relative grid gap-5 sm:grid-cols-2">
      <label className="text-sm font-medium text-ink-700">
        Full name
        <input name="name" required maxLength={120} autoComplete="name" className={input} />
      </label>
      <label className="text-sm font-medium text-ink-700">
        Phone
        <input name="phone" required maxLength={40} type="tel" autoComplete="tel" placeholder="+254…" className={input} />
      </label>
      <label className="text-sm font-medium text-ink-700">
        Email <span className="font-normal text-ink-400">(for your receipt)</span>
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
        <textarea name="details" required maxLength={2000} rows={5} placeholder="Goods, approximate weight/size, origin and destination, dates…" className={input} />
      </label>
      <Honeypot />
      <SubmitRow busy={state === "busy"} label="Send request" error={error} />
    </form>
  );
}

export function ContactForm() {
  const { submit, state, error, done, reset } = useSubmit("/api/contact");
  if (done) return <RequestDone refNo={done.ref} receiptUrl={done.receiptUrl} emailed={done.emailed} onAnother={reset} />;

  return (
    <form onSubmit={submit} className="relative grid gap-5 sm:grid-cols-2">
      <label className="text-sm font-medium text-ink-700">
        Full name
        <input name="name" required maxLength={120} autoComplete="name" className={input} />
      </label>
      <label className="text-sm font-medium text-ink-700">
        Email
        <input name="email" type="email" maxLength={160} autoComplete="email" className={input} />
      </label>
      <label className="text-sm font-medium text-ink-700">
        Phone <span className="font-normal text-ink-400">(optional)</span>
        <input name="phone" maxLength={40} type="tel" autoComplete="tel" placeholder="+254…" className={input} />
      </label>
      <label className="text-sm font-medium text-ink-700">
        Subject
        <input name="subject" maxLength={80} placeholder="e.g. Collecting my deposit" className={input} />
      </label>
      <label className="text-sm font-medium text-ink-700 sm:col-span-2">
        Message
        <textarea name="message" required maxLength={2000} rows={5} className={input} />
      </label>
      <Honeypot />
      <SubmitRow busy={state === "busy"} label="Send message" error={error} />
    </form>
  );
}

/** Tabs between "Request a quote" and "Send a message" on the contact page. */
export function ContactForms({ services, initialService, initialTab = "quote" }: { services: string[]; initialService?: string; initialTab?: "quote" | "message" }) {
  const [tab, setTab] = useState<"quote" | "message">(initialTab);
  return (
    <div>
      <div role="tablist" className="mb-6 inline-flex rounded-xl bg-ink-50 p-1 ring-1 ring-ink-100">
        {(
          [
            ["quote", "Request a quote"],
            ["message", "Send a message"],
          ] as const
        ).map(([k, l]) => (
          <button
            key={k}
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${tab === k ? "bg-white text-ink-900 shadow-sm" : "text-ink-500 hover:text-ink-900"}`}
          >
            {l}
          </button>
        ))}
      </div>
      {tab === "quote" ? <QuoteForm services={services} initialService={initialService} /> : <ContactForm />}
    </div>
  );
}
