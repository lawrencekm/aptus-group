import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Icon } from "@/components/Icon";
import { Markdown } from "@/components/Markdown";
import { PrintButton } from "@/components/PrintButton";
import { StatusBadge } from "@/components/StatusBadge";
import { getShipmentByCode, logActivity, recordView } from "@/lib/data";
import { clientIp, normalizeCode, rateLimit } from "@/lib/security";
import { PROGRESS_STEPS, progressIndex, site } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shipment status",
  robots: { index: false, follow: false, nocache: true },
};

const fmt = (iso: string) =>
  new Intl.DateTimeFormat("en-KE", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Nairobi" }).format(new Date(iso));

export default async function ShipmentPage({ params }: { params: Promise<{ code: string }> }) {
  const raw = (await params).code;
  const code = normalizeCode(raw);
  if (code !== raw) redirect(`/t/${code}`);

  const ip = await clientIp();
  // Throttle lookups per IP to stop code guessing.
  if (!(await rateLimit(`track:${ip}`, 30, 600))) {
    return (
      <div className="container-x py-24 text-center">
        <h1 className="font-display text-2xl font-bold text-ink-900">Too many lookups</h1>
        <p className="mt-2 text-ink-500">Please wait a few minutes and try again.</p>
      </div>
    );
  }

  const s = await getShipmentByCode(code);
  if (!s) {
    await logActivity("track.miss", `Unknown tracking code tried: ${code.slice(0, 3)}…`, { ip });
    redirect("/track?missing=1");
  }

  await recordView(s, ip);

  const idx = progressIndex(s.status);
  const onHold = s.status === "On Hold";
  const events = [...s.events].reverse();
  const shareUrl = `${site.url}/t/${s.code}`;

  return (
    <div className="bg-ink-50 py-10 sm:py-14">
      <div className="container-x max-w-4xl">
        <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link href="/track" className="inline-flex items-center gap-1 text-sm font-medium text-ink-500 hover:text-ink-900">
            <Icon name="arrow" className="h-4 w-4 rotate-180" /> Track another
          </Link>
          <PrintButton />
        </div>

        <article className="print-card overflow-hidden rounded-3xl bg-white shadow-xl shadow-ink-900/5 ring-1 ring-ink-100">
          {/* Header */}
          <header className="relative bg-ink-900 p-6 text-white sm:p-8">
            <div className="grid-lines absolute inset-0" aria-hidden="true" />
            <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-100">{s.service}</p>
                <h1 className="mt-2 font-display text-2xl font-extrabold sm:text-3xl">{s.title}</h1>
                <p className="mt-2 text-sm text-ink-200">
                  Tracking no. <span className="font-mono font-semibold text-white">{s.trackingNumber}</span>
                </p>
              </div>
              <div className="sm:text-right">
                <StatusBadge status={s.status} className="text-sm" />
                <p className="mt-2 text-xs text-ink-400">Updated {fmt(s.updatedAt)}</p>
              </div>
            </div>
          </header>

          {/* Progress */}
          <section className="border-b border-ink-100 p-6 sm:p-8" aria-label="Progress">
            {onHold && (
              <p className="mb-5 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                <Icon name="clock" className="h-4 w-4" /> This shipment is on hold. Contact us on {site.phoneDisplay} for details.
              </p>
            )}
            <ol className="grid grid-cols-6 gap-1.5">
              {PROGRESS_STEPS.map((step, i) => {
                const done = i <= idx;
                return (
                  <li key={step} className="flex flex-col gap-2">
                    <span className={`h-2 rounded-full ${done ? "bg-brand-500" : "bg-ink-100"}`} />
                    <span className={`hidden text-xs sm:block ${done ? "font-semibold text-ink-900" : "text-ink-400"}`}>{step}</span>
                  </li>
                );
              })}
            </ol>
            <p className="mt-3 text-sm text-ink-500 sm:hidden">
              Step {Math.max(idx + 1, 1)} of {PROGRESS_STEPS.length}: <strong className="text-ink-900">{s.status}</strong>
            </p>
          </section>

          {/* Details */}
          <section className="grid gap-px bg-ink-100 sm:grid-cols-2 lg:grid-cols-4" aria-label="Details">
            {[
              ["Holder", s.holder],
              ["Reference", s.reference || "—"],
              ["Origin", s.origin || "—"],
              ["Destination", s.destination || "—"],
            ].map(([k, v]) => (
              <div key={k} className="bg-white p-5">
                <p className="text-xs font-medium uppercase tracking-wider text-ink-400">{k}</p>
                <p className="mt-1 font-semibold text-ink-900">{v}</p>
              </div>
            ))}
          </section>

          {/* PDF receipt */}
          <section className="no-print flex flex-col gap-4 border-b border-ink-100 bg-gradient-to-r from-brand-50 to-white p-6 sm:flex-row sm:items-center sm:justify-between sm:px-8" aria-label="Receipt">
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-lg shadow-brand-500/25">
                <Icon name="file" className="h-6 w-6" />
              </span>
              <div>
                <h2 className="font-display text-base font-bold text-ink-900">Safe Keeping Receipt</h2>
                <p className="text-sm text-ink-500">
                  Bonded declaration (SKR) No. <span className="font-mono">{s.trackingNumber}</span>, as a PDF.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <a href={`/t/${s.code}/receipt`} target="_blank" rel="noopener" className="inline-flex items-center gap-2 rounded-xl bg-ink-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-ink-800">
                <Icon name="eye" className="h-4 w-4" /> View
              </a>
              <a href={`/t/${s.code}/receipt?download=1`} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-ink-800 ring-1 ring-ink-200 hover:bg-ink-50">
                <Icon name="download" className="h-4 w-4" /> Download
              </a>
            </div>
          </section>

          <div className="grid gap-0 lg:grid-cols-[1fr_1.2fr]">
            {/* Timeline */}
            <section className="border-b border-ink-100 p-6 sm:p-8 lg:border-b-0 lg:border-r" aria-label="History">
              <h2 className="font-display text-lg font-bold text-ink-900">History</h2>
              <ol className="mt-5 space-y-6">
                {events.map((e, i) => (
                  <li key={e.id} className="relative flex gap-4">
                    <span className="relative flex flex-col items-center">
                      <span className={`mt-1 h-3 w-3 rounded-full ring-4 ${i === 0 ? "bg-brand-500 ring-brand-100" : "bg-ink-200 ring-ink-50"}`} />
                      {i < events.length - 1 && <span className="absolute top-5 h-[calc(100%+0.5rem)] w-px bg-ink-100" />}
                    </span>
                    <div className="min-w-0 pb-1">
                      <p className="font-semibold text-ink-900">{e.status}</p>
                      <p className="text-xs text-ink-400">
                        {fmt(e.at)}
                        {e.location ? ` · ${e.location}` : ""}
                      </p>
                      {e.note && <p className="mt-1 text-sm text-ink-600">{e.note}</p>}
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            {/* Notes (markdown) */}
            <section className="p-6 sm:p-8" aria-label="Shipment notes">
              <h2 className="font-display text-lg font-bold text-ink-900">Shipment details</h2>
              {s.markdown ? (
                <div className="mt-3">
                  <Markdown>{s.markdown}</Markdown>
                </div>
              ) : (
                <p className="mt-3 text-sm text-ink-500">No additional notes.</p>
              )}
            </section>
          </div>

          <footer className="flex flex-col gap-3 border-t border-ink-100 bg-ink-50 p-6 text-xs text-ink-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <span>
              {site.name} · {site.address.street}, {site.address.locality} · {site.phoneDisplay}
            </span>
            <span className="font-mono">{shareUrl.replace(/^https?:\/\//, "")}</span>
          </footer>
        </article>

        <p className="no-print mt-6 text-center text-xs text-ink-400">
          This page is private to holders of the tracking code. Only trust tracking pages on {site.url.replace(/^https?:\/\//, "")}.
        </p>
      </div>
    </div>
  );
}
