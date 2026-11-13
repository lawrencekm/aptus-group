import Link from "next/link";
import { Icon } from "@/components/Icon";
import { TrackForm } from "@/components/TrackForm";
import { CtaBand, Eyebrow, Faq, ServiceGrid } from "@/components/Blocks";
import { JsonLd, faqLd } from "@/lib/jsonld";
import { site } from "@/lib/site";

export default function HomePage() {
  return (
    <>
      <JsonLd data={faqLd()} />

      {/* Hero */}
      <section className="relative overflow-hidden bg-ink-900 text-white">
        <div className="grid-lines absolute inset-0" aria-hidden="true" />
        <div className="absolute -left-40 top-20 h-[28rem] w-[28rem] rounded-full bg-brand-500/20 blur-3xl" aria-hidden="true" />
        <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-gold-400/10 blur-3xl" aria-hidden="true" />
        <div className="container-x relative grid items-center gap-12 py-16 sm:py-24 lg:grid-cols-[1.15fr_1fr]">
          <div>
            <Eyebrow light>Transport · Logistics · Safe Custody</Eyebrow>
            <h1 className="mt-4 font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
              Powering trade through <span className="text-brand-500">secure</span> logistics.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-ink-200">
              Freight forwarding, customs clearance, bonded warehousing and insured safe custody, run from the JKIA Cargo
              Transit Zone in Nairobi.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/contact" className="rounded-xl bg-brand-500 px-6 py-3.5 font-semibold text-white shadow-lg shadow-brand-500/30 hover:bg-brand-600">
                Get a free quote
              </Link>
              <Link href="/safe-custody" className="rounded-xl px-6 py-3.5 font-semibold text-white ring-1 ring-white/25 hover:bg-white/10">
                Safe custody services
              </Link>
            </div>
            <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-white/10 pt-6">
              {[
                ["24/7", "Monitored storage"],
                ["JKIA", "Airside access"],
                ["6", "Countries served"],
              ].map(([k, v]) => (
                <div key={v}>
                  <dt className="sr-only">{v}</dt>
                  <dd className="font-display text-2xl font-extrabold text-white">{k}</dd>
                  <dd className="text-xs text-ink-400">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="rounded-3xl bg-white/[0.06] p-6 ring-1 ring-white/10 backdrop-blur sm:p-8">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500">
                <Icon name="box" className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-display text-xl font-bold">Track your shipment</h2>
                <p className="text-sm text-ink-400">Use the code on your receipt or SMS.</p>
              </div>
            </div>
            <div className="mt-6">
              <TrackForm dark />
            </div>
            <ul className="mt-6 space-y-2 text-sm text-ink-200">
              {["Live status and location history", "Notes and documents from our team", "Private link, not searchable"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <Icon name="check" className="h-4 w-4 text-brand-500" /> {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="bg-ink-50 py-20">
        <div className="container-x">
          <div className="max-w-2xl">
            <Eyebrow>What we do</Eyebrow>
            <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">
              One partner from airport to final delivery
            </h2>
            <p className="mt-4 text-ink-500">
              We combine freight, customs and secure storage under one roof, so your goods change hands fewer times.
            </p>
          </div>
          <div className="mt-10">
            <ServiceGrid />
          </div>
        </div>
      </section>

      {/* Safe custody highlight */}
      <section className="py-20">
        <div className="container-x grid items-center gap-12 lg:grid-cols-2">
          <div className="relative overflow-hidden rounded-3xl bg-ink-900 p-8 text-white sm:p-10">
            <div className="grid-lines absolute inset-0" aria-hidden="true" />
            <div className="relative">
              <Icon name="shield" className="h-12 w-12 text-gold-400" strokeWidth={1.4} />
              <p className="mt-6 font-display text-2xl font-bold leading-snug">
                &ldquo;Your goods are released only to you, or to someone you authorise in writing.&rdquo;
              </p>
              <p className="mt-4 text-sm text-ink-400">Our release policy for every safe custody deposit.</p>
            </div>
          </div>
          <div>
            <Eyebrow>Safe custody</Eyebrow>
            <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">
              Peace of mind for documents, valuables and high-value cargo
            </h2>
            <ul className="mt-6 space-y-4">
              {[
                ["Sealed and catalogued", "Each item is logged, sealed and photographed on arrival."],
                ["Insured storage", "Cover is arranged for the declared value while goods are with us."],
                ["Controlled release", "Original ID and 24 hours' notice are needed to withdraw goods."],
                ["Private tracking", "You get a code and link to check status at any time."],
              ].map(([t, d]) => (
                <li key={t} className="flex gap-4">
                  <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                    <Icon name="check" className="h-4 w-4" strokeWidth={2.4} />
                  </span>
                  <div>
                    <h3 className="font-semibold text-ink-900">{t}</h3>
                    <p className="text-sm text-ink-500">{d}</p>
                  </div>
                </li>
              ))}
            </ul>
            <Link href="/safe-custody" className="mt-8 inline-flex items-center gap-2 font-semibold text-brand-600">
              How safe custody works <Icon name="arrow" className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-ink-100 bg-white py-20">
        <div className="container-x">
          <Eyebrow>How it works</Eyebrow>
          <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-ink-900">Four steps, fully tracked</h2>
          <ol className="mt-10 grid gap-6 md:grid-cols-4">
            {[
              ["Quote", "Tell us what you are moving or storing. We confirm price and timeline."],
              ["Receive", "We receive and inspect the goods, then issue a receipt and tracking code."],
              ["Move or store", "Goods travel, clear customs or stay in custody. Every step is logged."],
              ["Deliver or release", "We deliver to the door, or release against your original ID."],
            ].map(([t, d], i) => (
              <li key={t} className="relative rounded-2xl bg-ink-50 p-6">
                <span className="font-display text-4xl font-extrabold text-brand-500/30">0{i + 1}</span>
                <h3 className="mt-2 font-display text-lg font-bold text-ink-900">{t}</h3>
                <p className="mt-2 text-sm text-ink-500">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Location + FAQ */}
      <section className="bg-ink-50 py-20">
        <div className="container-x grid gap-12 lg:grid-cols-[1fr_1.3fr]">
          <div>
            <Eyebrow>Where we are</Eyebrow>
            <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-ink-900">At the heart of JKIA cargo</h2>
            <p className="mt-4 text-ink-500">
              Our office and warehouse are in the {site.address.street}, {site.address.locality}, minutes from the air cargo
              terminals and on the main road corridor to Mombasa and the region.
            </p>
            <div className="mt-6 overflow-hidden rounded-2xl ring-1 ring-ink-100">
              <iframe
                title="Map showing Aptus Group, Airport North Road, Nairobi"
                src={`https://www.google.com/maps?q=${site.geo.lat},${site.geo.lng}&z=14&output=embed`}
                className="h-64 w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
          <div>
            <Eyebrow>Questions</Eyebrow>
            <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-ink-900">Frequently asked</h2>
            <div className="mt-6">
              <Faq />
            </div>
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
