"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { Markdown } from "@/components/Markdown";
import { StatusBadge } from "@/components/StatusBadge";
import { parseFrontmatter } from "@/lib/frontmatter";
import { ORDER_TEMPLATE, RECEIPT_ROWS } from "@/lib/receipt-fields";
import { SHIPMENT_STATUSES, services, type ShipmentStatus } from "@/lib/site";
import type { Shipment } from "@/lib/types";

const field =
  "mt-1 w-full rounded-xl bg-white/5 px-3 py-2.5 text-sm text-white outline-none ring-1 ring-white/10 placeholder:text-ink-500 focus:ring-2 focus:ring-brand-500";
const label = "block text-xs font-medium text-ink-300";

// Every new order starts from the template (fields, receipt values and notes), ready to edit.
const TEMPLATE = parseFrontmatter(ORDER_TEMPLATE);

type Props = {
  shipment: Shipment | null;
  siteUrl: string;
  onClose: () => void;
  onSaved: (s: Shipment, message: string) => void;
  onCopy: (text: string, label: string) => void;
};

export function ShipmentEditor({ shipment, siteUrl, onClose, onSaved, onCopy }: Props) {
  const isNew = !shipment;
  const t = TEMPLATE.meta;
  const [f, setF] = useState({
    title: shipment?.title ?? t.title ?? "",
    holder: shipment?.holder ?? t.holder ?? "",
    reference: shipment?.reference ?? t.reference ?? "",
    service: shipment?.service ?? t.service ?? services[0].title,
    origin: shipment?.origin ?? t.origin ?? "",
    destination: shipment?.destination ?? t.destination ?? "",
    status: (shipment?.status ?? t.status ?? "Received") as ShipmentStatus,
    location: shipment ? "" : (t.location ?? ""),
    note: "",
  });
  const [markdown, setMarkdown] = useState(shipment?.markdown ?? TEMPLATE.body);
  const [receipt, setReceipt] = useState<Record<string, string>>(shipment?.receipt ?? t.receipt ?? {});
  const [mdTab, setMdTab] = useState<"write" | "preview">("write");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [drag, setDrag] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Re-sync when the parent swaps in the saved shipment
  useEffect(() => {
    if (!shipment) return;
    setF((x) => ({
      ...x,
      title: shipment.title,
      holder: shipment.holder,
      reference: shipment.reference ?? "",
      service: shipment.service,
      origin: shipment.origin ?? "",
      destination: shipment.destination ?? "",
      status: shipment.status,
    }));
    setMarkdown(shipment.markdown);
    setReceipt(shipment.receipt ?? {});
  }, [shipment]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function applyMarkdown(text: string) {
    const { meta, body } = parseFrontmatter(text);
    setF((x) => ({
      ...x,
      title: meta.title ?? x.title,
      holder: meta.holder ?? x.holder,
      reference: meta.reference ?? x.reference,
      service: meta.service ?? x.service,
      origin: meta.origin ?? x.origin,
      destination: meta.destination ?? x.destination,
      status: meta.status && (SHIPMENT_STATUSES as readonly string[]).includes(meta.status) ? (meta.status as ShipmentStatus) : x.status,
      location: meta.location ?? x.location,
    }));
    if (meta.receipt) setReceipt((r) => ({ ...r, ...meta.receipt }));
    setMarkdown(body);
  }

  async function readFile(file: File) {
    if (file.size > 200_000) return setError("File is too large (max 200 KB).");
    if (!/\.(md|markdown|txt)$/i.test(file.name)) return setError("Upload a .md or .txt file.");
    setError("");
    applyMarkdown(await file.text());
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch(isNew ? "/api/admin/shipments" : `/api/admin/shipments/${shipment!.id}`, {
      method: isNew ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...f, status: isNew ? f.status : shipment!.status, markdown, receipt }),
    });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(d.error || "Save failed.");
    onSaved(d.shipment, isNew ? `Created ${d.shipment.trackingNumber}` : "Changes saved");
  }

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF((x) => ({ ...x, [k]: e.target.value }));

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50" role="dialog" aria-modal="true" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="flex h-full w-full max-w-3xl flex-col bg-[#0f1520] ring-1 ring-white/10">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <h2 className="font-display text-lg font-bold text-white">{isNew ? "New shipment" : shipment.trackingNumber}</h2>
            {!isNew && <p className="text-xs text-ink-400">Created {new Date(shipment.createdAt).toLocaleString("en-KE")}</p>}
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-ink-400 hover:bg-white/5 hover:text-white" aria-label="Close">
            <Icon name="x" />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-5">
          {!isNew && <AccessCard s={shipment} siteUrl={siteUrl} onCopy={onCopy} onSaved={onSaved} />}
          {!isNew && <Timeline s={shipment} onSaved={onSaved} />}

          <form id="shipment-form" onSubmit={save} className="space-y-5">
            {isNew && (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDrag(true);
                }}
                onDragLeave={() => setDrag(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDrag(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) readFile(file);
                }}
                className={`rounded-2xl border-2 border-dashed p-6 text-center transition ${drag ? "border-brand-500 bg-brand-500/5" : "border-white/10"}`}
              >
                <Icon name="upload" className="mx-auto h-8 w-8 text-ink-400" />
                <p className="mt-2 text-sm text-white">This order starts from the template below. Edit it, or drop a markdown file here to fill it.</p>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  <button type="button" onClick={() => fileRef.current?.click()} className="rounded-lg bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/15">
                    Choose file
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setReceipt({});
                      applyMarkdown(ORDER_TEMPLATE);
                    }}
                    className="rounded-lg px-3 py-1.5 text-sm text-ink-300 ring-1 ring-white/10 hover:bg-white/5"
                  >
                    Reset to template
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const a = document.createElement("a");
                      a.href = URL.createObjectURL(new Blob([ORDER_TEMPLATE], { type: "text/markdown" }));
                      a.download = "aptus-order-template.md";
                      a.click();
                      URL.revokeObjectURL(a.href);
                    }}
                    className="rounded-lg px-3 py-1.5 text-sm text-ink-300 ring-1 ring-white/10 hover:bg-white/5"
                  >
                    Download template .md
                  </button>
                </div>
                <p className="mt-3 text-xs text-ink-500">Frontmatter keys (title, holder, status… and every receipt field such as passport_id or bonded_fee) fill the form automatically.</p>
                <input ref={fileRef} type="file" accept=".md,.markdown,.txt,text/markdown,text/plain" className="hidden" onChange={(e) => e.target.files?.[0] && readFile(e.target.files[0])} />
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <label className={`${label} sm:col-span-2`}>
                Short description *
                <input value={f.title} onChange={set("title")} required maxLength={160} placeholder="e.g. 8 cases, sealed wooden pallet" className={field} />
              </label>
              <label className={label}>
                Holder / customer *
                <input value={f.holder} onChange={set("holder")} required maxLength={120} className={field} />
              </label>
              <label className={label}>
                Customer reference
                <input value={f.reference} onChange={set("reference")} maxLength={80} className={field} />
              </label>
              <label className={label}>
                Service
                <input value={f.service} onChange={set("service")} list="services-list" maxLength={80} className={field} />
                <datalist id="services-list">
                  {services.map((s) => (
                    <option key={s.slug} value={s.title} />
                  ))}
                </datalist>
              </label>
              {isNew ? (
                <label className={label}>
                  Initial status
                  <select value={f.status} onChange={set("status")} className={field}>
                    {SHIPMENT_STATUSES.map((s) => (
                      <option key={s} className="bg-ink-900">{s}</option>
                    ))}
                  </select>
                </label>
              ) : (
                <div className={label}>
                  Current status
                  <div className="mt-2">
                    <StatusBadge status={shipment.status} />
                  </div>
                </div>
              )}
              <label className={label}>
                Origin
                <input value={f.origin} onChange={set("origin")} maxLength={120} className={field} />
              </label>
              <label className={label}>
                Destination
                <input value={f.destination} onChange={set("destination")} maxLength={120} className={field} />
              </label>
              {isNew && (
                <>
                  <label className={label}>
                    Current location
                    <input value={f.location} onChange={set("location")} maxLength={120} placeholder="e.g. Main warehouse, JKIA" className={field} />
                  </label>
                  <label className={label}>
                    First timeline note
                    <input value={f.note} onChange={set("note")} maxLength={500} placeholder="Shipment registered" className={field} />
                  </label>
                </>
              )}
            </div>

            <ReceiptFields value={receipt} onChange={setReceipt} holder={f.holder} />

            <div>
              <div className="flex items-center justify-between">
                <span className={label}>Details (markdown, shown on the tracking page)</span>
                <div className="flex rounded-lg bg-white/5 p-0.5 text-xs">
                  {(["write", "preview"] as const).map((t) => (
                    <button key={t} type="button" onClick={() => setMdTab(t)} className={`rounded-md px-2.5 py-1 capitalize ${mdTab === t ? "bg-white/10 text-white" : "text-ink-400"}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              {mdTab === "write" ? (
                <textarea
                  value={markdown}
                  onChange={(e) => setMarkdown(e.target.value)}
                  rows={12}
                  maxLength={50_000}
                  spellCheck={false}
                  placeholder={"## Contents\n- 2 sealed cases\n\n## Notes\nAnything the customer should know."}
                  className={`${field} font-mono text-[13px] leading-relaxed`}
                />
              ) : (
                <div className="mt-1 min-h-[14rem] rounded-xl bg-white p-5">
                  {markdown ? <Markdown>{markdown}</Markdown> : <p className="text-sm text-ink-400">Nothing to preview.</p>}
                </div>
              )}
            </div>

            {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300 ring-1 ring-red-500/30">{error}</p>}
          </form>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-white/10 px-5 py-4">
          <button onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm text-ink-200 hover:bg-white/5">
            Close
          </button>
          <button form="shipment-form" disabled={busy} className="rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60">
            {busy ? "Saving…" : isNew ? "Create & get link" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AccessCard({ s, siteUrl, onCopy, onSaved }: { s: Shipment; siteUrl: string; onCopy: Props["onCopy"]; onSaved: Props["onSaved"] }) {
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const link = `${siteUrl}/t/${s.code}`;

  async function rotate() {
    setBusy(true);
    const res = await fetch(`/api/admin/shipments/${s.id}/rotate`, { method: "POST" });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    setConfirm(false);
    if (res.ok) onSaved(d.shipment, "New code issued. The old link no longer works.");
  }

  return (
    <section className="rounded-2xl bg-gradient-to-br from-brand-500/15 to-transparent p-5 ring-1 ring-brand-500/25">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Customer access</h3>
        <span className="text-xs text-ink-400">
          <Icon name="eye" className="mr-1 inline h-3 w-3" />
          {s.views || 0} views
        </span>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-[auto_1fr]">
        <div>
          <p className="text-xs text-ink-400">Tracking code</p>
          <button onClick={() => onCopy(s.code, "Code")} className="mt-1 rounded-lg bg-black/30 px-3 py-2 font-mono text-xl font-bold tracking-[0.2em] text-white hover:bg-black/40">
            {s.code}
          </button>
        </div>
        <div className="min-w-0">
          <p className="text-xs text-ink-400">Private link</p>
          <div className="mt-1 flex items-center gap-2 rounded-lg bg-black/30 px-3 py-2">
            <span className="truncate font-mono text-sm text-ink-100">{link}</span>
            <button onClick={() => onCopy(link, "Link")} className="ml-auto shrink-0 text-ink-300 hover:text-white" aria-label="Copy link">
              <Icon name="copy" className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        <button onClick={() => onCopy(`${s.holder}, track ${s.trackingNumber} at ${link} (code ${s.code}).`, "Message")} className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-white hover:bg-white/15">
          <Icon name="copy" className="h-4 w-4" /> Copy message for customer
        </button>
        <a href={`/t/${s.code}`} target="_blank" className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-ink-200 ring-1 ring-white/10 hover:bg-white/5">
          <Icon name="eye" className="h-4 w-4" /> Open
        </a>
        <a href={`/api/admin/shipments/${s.id}/receipt`} target="_blank" className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-ink-200 ring-1 ring-white/10 hover:bg-white/5">
          <Icon name="file" className="h-4 w-4" /> Receipt PDF
        </a>
        {confirm ? (
          <span className="inline-flex items-center gap-2 rounded-lg bg-amber-400/10 px-3 py-1.5 text-amber-200">
            Old link stops working.
            <button onClick={rotate} disabled={busy} className="font-semibold underline">Confirm</button>
            <button onClick={() => setConfirm(false)} className="text-ink-300">Cancel</button>
          </span>
        ) : (
          <button onClick={() => setConfirm(true)} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-ink-200 ring-1 ring-white/10 hover:bg-white/5">
            <Icon name="refresh" className="h-4 w-4" /> New code
          </button>
        )}
      </div>
      <SendReceipt s={s} />
    </section>
  );
}

function SendReceipt({ s }: { s: Shipment }) {
  const preset = s.receipt?.email && /@/.test(s.receipt.email) ? s.receipt.email : "";
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(preset);
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "sent">("idle");
  const [error, setError] = useState("");

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setState("busy");
    setError("");
    const res = await fetch(`/api/admin/shipments/${s.id}/send-receipt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, message }),
    });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) {
      setState("idle");
      return setError(d.error || "Could not send.");
    }
    setState("sent");
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-600">
        <Icon name="send" className="h-4 w-4" /> Send receipt by email
      </button>
    );
  }
  return (
    <form onSubmit={send} className="mt-4 space-y-3 rounded-xl bg-black/25 p-4">
      <p className="text-sm font-semibold text-white">Email the Safe Keeping Receipt (PDF attached)</p>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setState("idle");
          }}
          placeholder="customer@example.com"
          aria-label="Recipient email"
          className={field}
        />
        <button disabled={state === "busy"} className="mt-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60">
          <Icon name="send" className="h-4 w-4" /> {state === "busy" ? "Sending…" : "Send"}
        </button>
      </div>
      <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={2} maxLength={1000} placeholder="Optional note to include in the email" aria-label="Note" className={field} />
      {state === "sent" && <p className="text-sm text-green-300">Sent to {email}.</p>}
      {error && <p className="text-sm text-red-300">{error}</p>}
      <button type="button" onClick={() => setOpen(false)} className="text-xs text-ink-400 hover:text-white">
        Close
      </button>
    </form>
  );
}

function ReceiptFields({ value, onChange, holder }: { value: Record<string, string>; onChange: (v: Record<string, string>) => void; holder: string }) {
  const filled = Object.values(value).filter(Boolean).length;
  const set = (k: string, v: string) => onChange({ ...value, [k]: v });
  return (
    <details open className="group rounded-2xl bg-white/[0.03] ring-1 ring-white/10">
      <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4">
        <span className="text-sm font-semibold text-white">
          Safe Keeping Receipt fields <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-xs font-normal text-ink-300">{filled} filled</span>
        </span>
        <Icon name="arrow" className="h-4 w-4 rotate-90 text-ink-400 transition group-open:-rotate-90" />
      </summary>
      <div className="space-y-3 border-t border-white/10 p-5">
        {RECEIPT_ROWS.map((row, i) => (
          <div key={i} className="grid gap-3 sm:grid-cols-4">
            {row.map((fld) => (
              <label key={fld.key} className={`${label} ${fld.span === 2 ? "sm:col-span-2" : ""}`}>
                <span className="line-clamp-1" title={fld.label}>
                  {fld.label}
                </span>
                {fld.long ? (
                  <textarea rows={2} value={value[fld.key] ?? ""} onChange={(e) => set(fld.key, e.target.value)} maxLength={400} className={field} />
                ) : (
                  <input value={value[fld.key] ?? ""} onChange={(e) => set(fld.key, e.target.value)} placeholder={fld.key === "holder_name" ? holder : ""} maxLength={400} className={field} />
                )}
              </label>
            ))}
          </div>
        ))}
        <p className="text-xs text-ink-500">
          Blank fields print empty on the receipt, like the paper form. Passport, email and phone are partly hidden on the copy customers download with their code.
        </p>
      </div>
    </details>
  );
}

function Timeline({ s, onSaved }: { s: Shipment; onSaved: Props["onSaved"] }) {
  const [status, setStatus] = useState<ShipmentStatus>(s.status);
  const [location, setLocation] = useState("");
  const [note, setNote] = useState("");
  const [at, setAt] = useState("");
  const [busy, setBusy] = useState(false);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch(`/api/admin/shipments/${s.id}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, location, note, at: at ? new Date(at).toISOString() : undefined }),
    });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) {
      setNote("");
      setAt("");
      onSaved(d.shipment, `Status updated: ${status}`);
    }
  }

  async function remove(id: string) {
    const res = await fetch(`/api/admin/shipments/${s.id}/events?eventId=${encodeURIComponent(id)}`, { method: "DELETE" });
    const d = await res.json().catch(() => ({}));
    if (res.ok) onSaved(d.shipment, "Timeline entry removed");
  }

  return (
    <section className="rounded-2xl bg-white/[0.03] p-5 ring-1 ring-white/10">
      <h3 className="text-sm font-semibold text-white">Status timeline</h3>
      <form onSubmit={add} className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className={label}>
          New status
          <select value={status} onChange={(e) => setStatus(e.target.value as ShipmentStatus)} className={field}>
            {SHIPMENT_STATUSES.map((x) => (
              <option key={x} className="bg-ink-900">{x}</option>
            ))}
          </select>
        </label>
        <label className={label}>
          Location
          <input value={location} onChange={(e) => setLocation(e.target.value)} maxLength={120} placeholder="e.g. JKIA cargo terminal" className={field} />
        </label>
        <label className={label}>
          Note for customer
          <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} className={field} />
        </label>
        <label className={label}>
          Date & time (optional)
          <input type="datetime-local" value={at} onChange={(e) => setAt(e.target.value)} className={`${field} [color-scheme:dark]`} />
        </label>
        <button disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/15 disabled:opacity-60 sm:col-span-2 sm:justify-self-start">
          <Icon name="plus" className="h-4 w-4" /> {busy ? "Adding…" : "Add update"}
        </button>
      </form>
      <ol className="mt-5 space-y-2">
        {[...s.events].reverse().map((e) => (
          <li key={e.id} className="group flex items-start gap-3 rounded-lg bg-black/20 p-3">
            <StatusBadge status={e.status} />
            <div className="min-w-0 flex-1 text-sm">
              <p className="text-xs text-ink-400">
                {new Date(e.at).toLocaleString("en-KE")}
                {e.location ? ` · ${e.location}` : ""}
              </p>
              {e.note && <p className="text-ink-100">{e.note}</p>}
            </div>
            {s.events.length > 1 && (
              <button onClick={() => remove(e.id)} className="rounded p-1 text-ink-500 opacity-0 hover:text-red-300 group-hover:opacity-100 focus:opacity-100" aria-label="Remove entry">
                <Icon name="trash" className="h-4 w-4" />
              </button>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
