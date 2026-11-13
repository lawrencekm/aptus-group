"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { Icon, type IconName } from "@/components/Icon";
import { StatusBadge } from "@/components/StatusBadge";
import { SHIPMENT_STATUSES, type ShipmentStatus } from "@/lib/site";
import type { Activity, Quote, Shipment } from "@/lib/types";
import { ShipmentEditor } from "./ShipmentEditor";

type Overview = { shipments: Shipment[]; activity: Activity[]; quotes: (Quote & { receiptUrl?: string })[]; lastLogin: { at: string; ip: string } | null };

const ACTIVE: ShipmentStatus[] = ["Booked", "Received", "In Safe Custody", "In Transit", "At Customs", "Out for Delivery", "On Hold"];

export function ago(iso: string) {
  const s = Math.round((Date.now() - Date.parse(iso)) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 30) return `${Math.floor(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
}

const activityIcon: Record<string, { icon: IconName; tone: string }> = {
  auth: { icon: "lock", tone: "text-amber-300 bg-amber-400/10" },
  "shipment.created": { icon: "plus", tone: "text-emerald-300 bg-emerald-400/10" },
  "shipment.updated": { icon: "edit", tone: "text-sky-300 bg-sky-400/10" },
  "shipment.status": { icon: "activity", tone: "text-indigo-300 bg-indigo-400/10" },
  "shipment.deleted": { icon: "trash", tone: "text-red-300 bg-red-400/10" },
  "shipment.code_rotated": { icon: "refresh", tone: "text-violet-300 bg-violet-400/10" },
  "shipment.viewed": { icon: "eye", tone: "text-cyan-300 bg-cyan-400/10" },
  "track.miss": { icon: "search", tone: "text-orange-300 bg-orange-400/10" },
  "quote.received": { icon: "inbox", tone: "text-brand-100 bg-brand-500/15" },
  "contact.received": { icon: "mail", tone: "text-brand-100 bg-brand-500/15" },
  "shipment.receipt_sent": { icon: "send", tone: "text-emerald-300 bg-emerald-400/10" },
  "bot.blocked": { icon: "shield", tone: "text-amber-300 bg-amber-400/10" },
};
function iconFor(kind: string) {
  return activityIcon[kind] || (kind.startsWith("auth") ? activityIcon.auth : { icon: "activity" as IconName, tone: "text-ink-200 bg-white/5" });
}

type Toast = { id: number; text: string };

export function Dashboard({ siteUrl }: { siteUrl: string }) {
  const router = useRouter();
  const [data, setData] = useState<Overview | null>(null);
  const [loadError, setLoadError] = useState("");
  const [tab, setTab] = useState<"shipments" | "quotes">("shipments");
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | ShipmentStatus>("all");
  const [feedFilter, setFeedFilter] = useState<"all" | "security" | "shipments" | "public">("all");
  const [editing, setEditing] = useState<Shipment | "new" | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Shipment | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((text: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
  }, []);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/overview", { cache: "no-store" });
    if (res.status === 401) {
      router.replace("/admin/login");
      return;
    }
    if (!res.ok) {
      setLoadError("Could not load data. Check the database connection.");
      return;
    }
    setLoadError("");
    setData(await res.json());
  }, [router]);

  useEffect(() => {
    load();
    const t = setInterval(load, 30_000); // keep the activity feed fresh
    return () => clearInterval(t);
  }, [load]);

  const linkFor = (s: Shipment) => `${siteUrl}/t/${s.code}`;
  async function copy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast(`${label} copied`);
    } catch {
      toast("Copy failed. Select and copy manually.");
    }
  }

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/admin/login");
  }

  async function doDelete(s: Shipment) {
    const res = await fetch(`/api/admin/shipments/${s.id}`, { method: "DELETE" });
    setConfirmDelete(null);
    if (res.ok) {
      toast(`${s.trackingNumber} deleted`);
      load();
    } else toast("Delete failed");
  }

  const shipments = useMemo(() => data?.shipments ?? [], [data]);
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return shipments.filter((s) => {
      if (statusFilter === "active" && !ACTIVE.includes(s.status)) return false;
      if (statusFilter !== "all" && statusFilter !== "active" && s.status !== statusFilter) return false;
      if (!term) return true;
      return [s.trackingNumber, s.code, s.title, s.holder, s.reference, s.origin, s.destination]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term));
    });
  }, [shipments, q, statusFilter]);

  const stats = useMemo(() => {
    const act = data?.activity ?? [];
    const dayAgo = Date.now() - 86400_000;
    const weekAgo = Date.now() - 7 * 86400_000;
    return {
      total: shipments.length,
      active: shipments.filter((s) => ACTIVE.includes(s.status)).length,
      custody: shipments.filter((s) => s.status === "In Safe Custody").length,
      done: shipments.filter((s) => s.status === "Delivered" || s.status === "Released").length,
      views: shipments.reduce((n, s) => n + (s.views || 0), 0),
      views24: act.filter((a) => a.kind === "shipment.viewed" && Date.parse(a.at) > dayAgo).length,
      quotes7: (data?.quotes ?? []).filter((x) => Date.parse(x.at) > weekAgo).length,
      failed24: act.filter((a) => a.kind === "auth.failed" && Date.parse(a.at) > dayAgo).length,
    };
  }, [data, shipments]);

  // Activity per day for the last 14 days
  const chart = useMemo(() => {
    const days: { label: string; count: number }[] = [];
    const act = data?.activity ?? [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const start = d.getTime();
      const end = start + 86400_000;
      days.push({
        label: d.toLocaleDateString("en-KE", { day: "numeric", month: "short" }),
        count: act.filter((a) => {
          const t = Date.parse(a.at);
          return t >= start && t < end;
        }).length,
      });
    }
    return days;
  }, [data]);
  const chartMax = Math.max(1, ...chart.map((d) => d.count));

  const feed = useMemo(() => {
    const act = data?.activity ?? [];
    return act.filter((a) => {
      if (feedFilter === "security") return a.kind.startsWith("auth") || a.kind === "track.miss" || a.kind === "bot.blocked";
      if (feedFilter === "shipments") return a.kind.startsWith("shipment.") && a.kind !== "shipment.viewed";
      if (feedFilter === "public") return a.kind === "shipment.viewed" || a.kind === "quote.received" || a.kind === "contact.received" || a.kind === "track.miss";
      return true;
    });
  }, [data, feedFilter]);

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0b1019]/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[90rem] items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Logo light />
            <span className="hidden rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs font-medium text-emerald-300 ring-1 ring-emerald-400/20 sm:inline-flex sm:items-center sm:gap-1.5">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> Secure session
            </span>
          </div>
          <div className="flex items-center gap-2">
            <a href="/" target="_blank" className="hidden rounded-lg px-3 py-2 text-sm text-ink-200 hover:bg-white/5 sm:block">
              View site
            </a>
            <button onClick={signOut} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-200 ring-1 ring-white/10 hover:bg-white/5">
              <Icon name="logout" className="h-4 w-4" /> Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[90rem] px-4 py-6 sm:px-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="font-display text-2xl font-extrabold text-white">Control room</h1>
            <p className="text-sm text-ink-400">
              {data?.lastLogin ? <>Last sign-in {ago(data.lastLogin.at)} from {data.lastLogin.ip}</> : "Shipments, tracking links and activity in one place."}
            </p>
          </div>
          <button
            onClick={() => setEditing("new")}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 py-3 font-semibold text-white shadow-lg shadow-brand-500/20 hover:bg-brand-600"
          >
            <Icon name="upload" className="h-4 w-4" /> New shipment
          </button>
        </div>

        {loadError && <p className="mt-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-300 ring-1 ring-red-500/30">{loadError}</p>}

        {/* KPIs */}
        <section className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {[
            { k: "Shipments", v: stats.total, icon: "box" as IconName },
            { k: "Active", v: stats.active, icon: "activity" as IconName },
            { k: "In custody", v: stats.custody, icon: "shield" as IconName },
            { k: "Delivered / released", v: stats.done, icon: "check" as IconName },
            { k: "Tracking views", v: stats.views, sub: `${stats.views24} in last 24h`, icon: "eye" as IconName },
            { k: "Requests (7d)", v: stats.quotes7, icon: "inbox" as IconName },
          ].map((c) => (
            <div key={c.k} className="rounded-2xl bg-white/[0.03] p-4 ring-1 ring-white/10">
              <div className="flex items-center justify-between text-ink-400">
                <span className="text-xs font-medium">{c.k}</span>
                <Icon name={c.icon} className="h-4 w-4" />
              </div>
              <p className="mt-2 font-display text-3xl font-extrabold text-white">{data ? c.v : "–"}</p>
              {c.sub && <p className="text-xs text-ink-500">{c.sub}</p>}
            </div>
          ))}
        </section>

        {stats.failed24 > 0 && (
          <p className="mt-4 flex items-center gap-2 rounded-xl bg-amber-400/10 px-4 py-3 text-sm text-amber-200 ring-1 ring-amber-400/20">
            <Icon name="lock" className="h-4 w-4" /> {stats.failed24} failed sign-in attempt(s) in the last 24 hours.
          </p>
        )}

        <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_24rem]">
          {/* Main panel */}
          <section className="min-w-0 rounded-2xl bg-white/[0.03] ring-1 ring-white/10">
            <div className="flex items-center gap-1 border-b border-white/10 px-3 pt-3">
              {(["shipments", "quotes"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`rounded-t-lg px-4 py-2.5 text-sm font-semibold capitalize ${tab === t ? "bg-white/5 text-white" : "text-ink-400 hover:text-ink-200"}`}
                >
                  {t === "quotes" ? "Inbox" : t}
                  <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-xs">{t === "shipments" ? shipments.length : data?.quotes.length ?? 0}</span>
                </button>
              ))}
            </div>

            {tab === "shipments" ? (
              <>
                <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
                  <div className="flex flex-1 items-center gap-2 rounded-xl bg-white/5 px-3 ring-1 ring-white/10 focus-within:ring-brand-500">
                    <Icon name="search" className="h-4 w-4 text-ink-400" />
                    <input
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder="Search tracking no., code, holder, route…"
                      className="h-10 w-full bg-transparent text-sm text-white outline-none placeholder:text-ink-500"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                    className="h-10 rounded-xl bg-white/5 px-3 text-sm text-white ring-1 ring-white/10 outline-none"
                  >
                    <option value="all" className="bg-ink-900">All statuses</option>
                    <option value="active" className="bg-ink-900">Active only</option>
                    {SHIPMENT_STATUSES.map((s) => (
                      <option key={s} value={s} className="bg-ink-900">{s}</option>
                    ))}
                  </select>
                </div>

                {!data ? (
                  <p className="p-8 text-center text-sm text-ink-400">Loading…</p>
                ) : filtered.length === 0 ? (
                  <div className="p-12 text-center">
                    <Icon name="box" className="mx-auto h-10 w-10 text-ink-600" />
                    <p className="mt-3 font-semibold text-white">{shipments.length ? "No matches" : "No shipments yet"}</p>
                    <p className="text-sm text-ink-400">{shipments.length ? "Try another search or filter." : "Upload a markdown file or fill in the form to create the first one."}</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-white/5">
                    {filtered.map((s) => (
                      <li key={s.id} className="grid gap-3 px-4 py-4 hover:bg-white/[0.02] md:grid-cols-[1fr_auto] md:items-center">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-sm font-semibold text-white">{s.trackingNumber}</span>
                            <StatusBadge status={s.status} />
                            <span className="text-xs text-ink-500">· {s.service}</span>
                          </div>
                          <p className="mt-1 truncate text-sm text-ink-200">
                            {s.title} <span className="text-ink-500">— {s.holder}</span>
                          </p>
                          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-500">
                            <button onClick={() => copy(s.code, "Code")} className="font-mono text-ink-300 hover:text-white" title="Copy code">
                              {s.code}
                            </button>
                            {(s.origin || s.destination) && <span>{s.origin || "?"} → {s.destination || "?"}</span>}
                            <span className="inline-flex items-center gap-1"><Icon name="eye" className="h-3 w-3" />{s.views || 0}{s.lastViewedAt ? ` · last ${ago(s.lastViewedAt)}` : ""}</span>
                            <span>updated {ago(s.updatedAt)}</span>
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-1">
                          <ActionBtn icon="link" label="Copy link" onClick={() => copy(linkFor(s), "Link")} />
                          <ActionBtn icon="copy" label="Copy SMS text" onClick={() => copy(`${s.holder}, track ${s.trackingNumber} at ${linkFor(s)} (code ${s.code}).`, "Message")} />
                          <a href={`/t/${s.code}`} target="_blank" className="rounded-lg p-2 text-ink-400 hover:bg-white/5 hover:text-white" title="Open tracking page" aria-label="Open tracking page">
                            <Icon name="eye" className="h-4 w-4" />
                          </a>
                          <ActionBtn icon="edit" label="Edit" onClick={() => setEditing(s)} />
                          <ActionBtn icon="trash" label="Delete" danger onClick={() => setConfirmDelete(s)} />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <QuotesList quotes={data?.quotes ?? []} onCopy={copy} />
            )}
          </section>

          {/* Activity column */}
          <aside className="space-y-6">
            <section className="rounded-2xl bg-white/[0.03] p-4 ring-1 ring-white/10">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white">Activity · 14 days</h2>
                <span className="text-xs text-ink-500">{chart.reduce((n, d) => n + d.count, 0)} events</span>
              </div>
              <div className="mt-4 flex h-24 items-end gap-1" role="img" aria-label="Events per day over the last 14 days">
                {chart.map((d) => (
                  <div key={d.label} className="group relative flex-1">
                    <div className="rounded-t bg-brand-500/70 transition group-hover:bg-brand-500" style={{ height: `${Math.max(4, (d.count / chartMax) * 96)}px` }} />
                    <span className="pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-ink-800 px-1.5 py-0.5 text-[10px] text-white group-hover:block">
                      {d.label}: {d.count}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl bg-white/[0.03] ring-1 ring-white/10">
              <div className="flex items-center justify-between p-4 pb-2">
                <h2 className="text-sm font-semibold text-white">Live activity</h2>
                <button onClick={load} className="rounded-lg p-1.5 text-ink-400 hover:bg-white/5 hover:text-white" aria-label="Refresh">
                  <Icon name="refresh" className="h-4 w-4" />
                </button>
              </div>
              <div className="flex gap-1 px-4 pb-3">
                {(["all", "shipments", "public", "security"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFeedFilter(f)}
                    className={`rounded-full px-2.5 py-1 text-xs capitalize ${feedFilter === f ? "bg-white/10 text-white" : "text-ink-400 hover:text-ink-200"}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <ol className="max-h-[32rem] space-y-1 overflow-y-auto px-2 pb-3">
                {feed.length === 0 && <li className="p-4 text-center text-sm text-ink-500">Nothing yet.</li>}
                {feed.map((a) => {
                  const ic = iconFor(a.kind);
                  return (
                    <li key={a.id} className="flex gap-3 rounded-lg p-2 hover:bg-white/[0.03]">
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${ic.tone}`}>
                        <Icon name={ic.icon} className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm text-ink-100">{a.message}</p>
                        <p className="text-xs text-ink-500">
                          {ago(a.at)}
                          {a.ip ? ` · ${a.ip}` : ""}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          </aside>
        </div>
      </div>

      {editing && (
        <ShipmentEditor
          shipment={editing === "new" ? null : editing}
          siteUrl={siteUrl}
          onClose={() => setEditing(null)}
          onSaved={(s, msg) => {
            toast(msg);
            setEditing(s);
            load();
          }}
          onCopy={copy}
        />
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-2xl bg-ink-900 p-6 ring-1 ring-white/10">
            <h2 className="font-display text-lg font-bold text-white">Delete {confirmDelete.trackingNumber}?</h2>
            <p className="mt-2 text-sm text-ink-300">
              The tracking link and code will stop working immediately. This cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setConfirmDelete(null)} className="rounded-lg px-4 py-2 text-sm text-ink-200 hover:bg-white/5">
                Cancel
              </button>
              <button onClick={() => doDelete(confirmDelete)} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="pointer-events-none fixed bottom-4 left-1/2 z-[60] flex -translate-x-1/2 flex-col items-center gap-2">
        {toasts.map((t) => (
          <div key={t.id} className="rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-ink-900 shadow-xl">
            {t.text}
          </div>
        ))}
      </div>
    </div>
  );
}

function ActionBtn({ icon, label, onClick, danger }: { icon: IconName; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`rounded-lg p-2 ${danger ? "text-ink-400 hover:bg-red-500/10 hover:text-red-300" : "text-ink-400 hover:bg-white/5 hover:text-white"}`}
    >
      <Icon name={icon} className="h-4 w-4" />
    </button>
  );
}

function QuotesList({ quotes, onCopy }: { quotes: (Quote & { receiptUrl?: string })[]; onCopy: (t: string, l: string) => void }) {
  if (!quotes.length) return <p className="p-12 text-center text-sm text-ink-400">No requests yet. Quote requests and contact messages from the website appear here.</p>;
  return (
    <ul className="divide-y divide-white/5">
      {quotes.map((q) => (
        <li key={q.id} className="px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold text-white">
              {q.name}
              <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-normal ${q.kind === "contact" ? "bg-sky-400/10 text-sky-200" : "bg-brand-500/15 text-brand-100"}`}>
                {q.kind === "contact" ? "Message" : "Quote"}
              </span>
              <span className="ml-2 rounded-full bg-white/5 px-2 py-0.5 text-xs font-normal text-ink-300">{q.service}</span>
              {q.ref && <span className="ml-2 font-mono text-xs font-normal text-ink-400">{q.ref}</span>}
            </p>
            <span className="text-xs text-ink-500">{ago(q.at)}</span>
          </div>
          <p className="mt-2 whitespace-pre-line text-sm text-ink-200">{q.details}</p>
          <div className="mt-2 flex flex-wrap gap-3 text-xs">
            <a href={`tel:${q.phone}`} className="text-brand-500 hover:underline">{q.phone}</a>
            {q.email && <a href={`mailto:${q.email}`} className="text-brand-500 hover:underline">{q.email}</a>}
            <button onClick={() => onCopy(`${q.name} ${q.phone} ${q.email ?? ""}\n${q.details}`, "Request")} className="text-ink-400 hover:text-white">Copy</button>
            {q.receiptUrl && q.ref && (
              <a href={q.receiptUrl} target="_blank" className="text-ink-400 hover:text-white">
                Receipt PDF
              </a>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
