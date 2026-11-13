import Link from "next/link";
import { Icon } from "./Icon";
import { faqs, services, site } from "@/lib/site";

export function Eyebrow({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <p className={`text-xs font-bold uppercase tracking-[0.2em] ${light ? "text-brand-100" : "text-brand-600"}`}>{children}</p>
  );
}

export function PageHero({ eyebrow, title, intro }: { eyebrow: string; title: string; intro: string }) {
  return (
    <section className="relative overflow-hidden bg-ink-900 text-white">
      <div className="grid-lines absolute inset-0" aria-hidden="true" />
      <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand-500/25 blur-3xl" aria-hidden="true" />
      <div className="container-x relative py-16 sm:py-20">
        <Eyebrow light>{eyebrow}</Eyebrow>
        <h1 className="mt-3 max-w-3xl font-display text-3xl font-extrabold tracking-tight sm:text-5xl">{title}</h1>
        <p className="mt-4 max-w-2xl text-lg text-ink-200">{intro}</p>
      </div>
    </section>
  );
}

export function ServiceGrid() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {services.map((s) => (
        <Link
          key={s.slug}
          href={`/services#${s.slug}`}
          className="group rounded-2xl border border-ink-100 bg-white p-6 transition hover:-translate-y-0.5 hover:border-brand-100 hover:shadow-lg hover:shadow-ink-900/5"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <Icon name={s.icon} className="h-6 w-6" />
          </span>
          <h3 className="mt-4 font-display text-lg font-bold text-ink-900">{s.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-ink-500">{s.short}</p>
          <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-600">
            Learn more <Icon name="arrow" className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </span>
        </Link>
      ))}
    </div>
  );
}

export function Faq() {
  return (
    <div className="divide-y divide-ink-100 rounded-2xl border border-ink-100 bg-white">
      {faqs.map((f) => (
        <details key={f.q} className="group p-5 [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-ink-900">
            <h3>{f.q}</h3>
            <Icon name="plus" className="h-5 w-5 shrink-0 text-ink-400 transition group-open:rotate-45" />
          </summary>
          <p className="mt-3 text-ink-500">{f.a}</p>
        </details>
      ))}
    </div>
  );
}

export function CtaBand() {
  return (
    <section className="bg-brand-500">
      <div className="container-x flex flex-col items-start justify-between gap-6 py-12 text-white md:flex-row md:items-center">
        <div>
          <h2 className="font-display text-2xl font-extrabold sm:text-3xl">Moving or storing something valuable?</h2>
          <p className="mt-2 text-brand-50">Tell us what it is and where it&apos;s going. We reply within one working day.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/contact" className="rounded-xl bg-white px-5 py-3 font-semibold text-brand-700 hover:bg-brand-50">
            Request a quote
          </Link>
          <a href={`tel:${site.phone}`} className="rounded-xl px-5 py-3 font-semibold text-white ring-1 ring-white/50 hover:bg-white/10">
            Call {site.phoneDisplay}
          </a>
        </div>
      </div>
    </section>
  );
}
