import type { Metadata } from "next";
import Link from "next/link";
import { CtaBand, Eyebrow, PageHero } from "@/components/Blocks";
import { Icon } from "@/components/Icon";
import { JsonLd, breadcrumbLd } from "@/lib/jsonld";
import { site } from "@/lib/site";
import { photos } from "@/lib/images";

export const metadata: Metadata = {
  title: "Safe Custody & Safe Keeping in Nairobi",
  description:
    "Insured safe custody for documents, valuables and high-value cargo at the JKIA Cargo Transit Zone, Nairobi. Sealed storage, private tracking and ID-controlled release.",
  alternates: { canonical: "/safe-custody" },
};

const steps = [
  { t: "Book", d: "Call or request a quote. Tell us what you are depositing, its declared value and how long you need storage." },
  { t: "Deposit & inspect", d: "Bring the goods with your original ID or passport. We inspect, weigh, photograph and seal them in your presence." },
  { t: "Receipt & tracking code", d: "You receive a safe custody receipt with a reference number and a private tracking code and link." },
  { t: "Storage", d: "Goods are held in a monitored, access-controlled store. Any movement or status change shows on your tracking page." },
  { t: "Release", d: "Give 24 hours' written notice and present your original ID and receipt. Authorised representatives need your signed letter." },
];

const accepted = [
  "Personal and company documents, title deeds and certificates",
  "Jewellery, watches and personal valuables",
  "Household effects and family heirlooms",
  "Commercial stock and samples awaiting clearance or sale",
  "Electronics and equipment in transit",
];

export default function SafeCustodyPage() {
  return (
    <>
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Safe Custody", path: "/safe-custody" }])} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Service",
          name: "Safe custody and safe keeping",
          serviceType: "Secure storage",
          provider: { "@id": `${site.url}/#business` },
          areaServed: { "@type": "City", name: "Nairobi" },
          description: "Insured, sealed, access-controlled storage for documents, valuables and cargo near JKIA, Nairobi.",
          url: `${site.url}/safe-custody`,
        }}
      />
      <PageHero
        eyebrow="Safe custody"
        title="Safe keeping for what matters most"
        intro="Secure, insured storage at the JKIA Cargo Transit Zone, with a private tracking page for every deposit."
        image={photos.vaultWall}
      />

      <section className="py-16">
        <div className="container-x grid gap-12 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <Eyebrow>The process</Eyebrow>
            <h2 className="mt-3 font-display text-3xl font-extrabold text-ink-900">How safe custody works</h2>
            <ol className="relative mt-8 space-y-8 border-l-2 border-ink-100 pl-8">
              {steps.map((s, i) => (
                <li key={s.t} className="relative">
                  <span className="absolute -left-[45px] flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white ring-4 ring-white">
                    {i + 1}
                  </span>
                  <h3 className="font-display text-lg font-bold text-ink-900">{s.t}</h3>
                  <p className="mt-1 text-ink-500">{s.d}</p>
                </li>
              ))}
            </ol>
          </div>
          <aside className="space-y-6">
            <div className="rounded-3xl bg-ink-900 p-8 text-white">
              <Icon name="lock" className="h-8 w-8 text-gold-400" />
              <h2 className="mt-4 font-display text-xl font-bold">What we can hold</h2>
              <ul className="mt-4 space-y-3 text-sm text-ink-200">
                {accepted.map((a) => (
                  <li key={a} className="flex gap-2">
                    <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" /> {a}
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-xs text-ink-400">
                We do not accept hazardous, illegal or undeclared goods. All deposits are subject to inspection and to Kenyan
                law, and goods that need customs clearance must be cleared first.
              </p>
            </div>
            <div className="rounded-3xl border border-ink-100 p-8">
              <h2 className="font-display text-lg font-bold text-ink-900">Protect yourself</h2>
              <p className="mt-2 text-sm text-ink-500">
                Only trust tracking pages on <strong>{site.url.replace(/^https?:\/\//, "")}</strong>. We will never ask you to pay
                release or &ldquo;clearance&rdquo; fees to a personal account, and we never contact you about goods you did not
                deposit yourself. If in doubt, call {site.phoneDisplay}.
              </p>
            </div>
          </aside>
        </div>
      </section>

      <section className="bg-ink-50 py-16">
        <div className="container-x text-center">
          <h2 className="font-display text-2xl font-extrabold text-ink-900">Already have a tracking code?</h2>
          <Link href="/track" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-3 font-semibold text-white hover:bg-brand-600">
            Track your deposit <Icon name="arrow" className="h-4 w-4" />
          </Link>
        </div>
      </section>
      <CtaBand />
    </>
  );
}
