import type { Metadata } from "next";
import Link from "next/link";
import { CtaBand, PageHero } from "@/components/Blocks";
import { Icon } from "@/components/Icon";
import { JsonLd, breadcrumbLd } from "@/lib/jsonld";
import { services, site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Logistics Services in Nairobi: Freight, Customs, Warehousing",
  description:
    "Air and sea freight, customs clearance at JKIA and Mombasa, bonded warehousing, regional trucking and safe custody from Aptus Group, Airport North Road, Nairobi.",
  alternates: { canonical: "/services" },
};

export default function ServicesPage() {
  return (
    <>
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Services", path: "/services" }])} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": services.map((s) => ({
            "@type": "Service",
            name: s.title,
            description: s.body,
            serviceType: s.title,
            url: `${site.url}/services#${s.slug}`,
            provider: { "@id": `${site.url}/#business` },
            areaServed: site.areaServed.map((name) => ({ "@type": "Place", name })),
          })),
        }}
      />
      <PageHero
        eyebrow="Services"
        title="Logistics and safe custody, end to end"
        intro="Everything you need to move, clear and protect goods in and out of Kenya, handled by one team at JKIA."
      />
      <section className="py-16">
        <div className="container-x space-y-6">
          {services.map((s, i) => (
            <article
              key={s.slug}
              id={s.slug}
              className="scroll-mt-28 grid gap-6 rounded-3xl border border-ink-100 bg-white p-6 sm:p-10 md:grid-cols-[auto_1fr_auto] md:items-center"
            >
              <span className={`flex h-16 w-16 items-center justify-center rounded-2xl ${i % 2 ? "bg-ink-900 text-gold-400" : "bg-brand-50 text-brand-600"}`}>
                <Icon name={s.icon} className="h-8 w-8" strokeWidth={1.5} />
              </span>
              <div>
                <h2 className="font-display text-2xl font-bold text-ink-900">{s.title}</h2>
                <p className="mt-1 font-medium text-ink-700">{s.short}</p>
                <p className="mt-3 max-w-3xl text-ink-500">{s.body}</p>
              </div>
              <Link
                href={s.slug === "safe-custody" ? "/safe-custody" : `/contact?service=${encodeURIComponent(s.title)}`}
                className="inline-flex items-center gap-2 justify-self-start rounded-xl bg-ink-900 px-5 py-3 text-sm font-semibold text-white hover:bg-ink-800"
              >
                {s.slug === "safe-custody" ? "How it works" : "Get a quote"} <Icon name="arrow" className="h-4 w-4" />
              </Link>
            </article>
          ))}
        </div>
      </section>
      <CtaBand />
    </>
  );
}
