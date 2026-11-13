import type { Metadata } from "next";
import { Icon } from "@/components/Icon";
import { TrackForm } from "@/components/TrackForm";
import { JsonLd, breadcrumbLd } from "@/lib/jsonld";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Track Your Shipment",
  description: "Track an Aptus Group shipment or safe custody deposit with the private tracking code on your receipt.",
  alternates: { canonical: "/track" },
};

export default async function TrackPage({ searchParams }: { searchParams: Promise<{ missing?: string }> }) {
  const { missing } = await searchParams;
  return (
    <>
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Track", path: "/track" }])} />
      <section className="relative overflow-hidden bg-ink-900 text-white">
        <div className="grid-lines absolute inset-0" aria-hidden="true" />
        <div className="absolute left-1/2 top-0 h-96 w-[40rem] -translate-x-1/2 rounded-full bg-brand-500/20 blur-3xl" aria-hidden="true" />
        <div className="container-x relative mx-auto max-w-2xl py-20 text-center sm:py-28">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500">
            <Icon name="box" className="h-7 w-7" />
          </span>
          <h1 className="mt-6 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">Track your shipment</h1>
          <p className="mt-4 text-ink-200">Enter the tracking code from your receipt or SMS. Codes are not case-sensitive.</p>
          {missing && (
            <p role="alert" className="mx-auto mt-6 max-w-md rounded-xl bg-brand-500/15 px-4 py-3 text-sm text-brand-100 ring-1 ring-brand-500/40">
              We couldn&apos;t find a shipment with that code. Check it and try again, or call {site.phoneDisplay}.
            </p>
          )}
          <div className="mt-8 text-left">
            <TrackForm dark autoFocus />
          </div>
        </div>
      </section>
      <section className="py-14">
        <div className="container-x grid gap-6 md:grid-cols-3">
          {[
            { icon: "lock" as const, t: "Private by design", d: "Each shipment has its own random code. Tracking pages are hidden from search engines." },
            { icon: "activity" as const, t: "Live status", d: "Our team updates the status and location as your goods move." },
            { icon: "print" as const, t: "Print or share", d: "Print the tracking page for your records or share the link with your agent." },
          ].map((c) => (
            <div key={c.t} className="rounded-2xl border border-ink-100 p-6">
              <Icon name={c.icon} className="h-6 w-6 text-brand-600" />
              <h2 className="mt-3 font-display font-bold text-ink-900">{c.t}</h2>
              <p className="mt-1 text-sm text-ink-500">{c.d}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
