import type { Metadata } from "next";
import { PageHero } from "@/components/Blocks";
import { Icon } from "@/components/Icon";
import { ContactForms } from "@/components/QuoteForm";
import { JsonLd, breadcrumbLd } from "@/lib/jsonld";
import { services, site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact & Free Quote",
  description: `Request a free logistics or safe custody quote from Aptus Group, Airport North Road, Nairobi. Call ${site.phoneDisplay} or email ${site.email}.`,
  alternates: { canonical: "/contact" },
};

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ service?: string; tab?: string }> }) {
  const { service, tab } = await searchParams;
  return (
    <>
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Contact", path: "/contact" }])} />
      <PageHero eyebrow="Contact" title="Get a free quote or send us a message" intro="Tell us what you need moved, cleared or stored. We reply within one working day, and you get a PDF receipt for every request." />
      <section className="py-16">
        <div className="container-x grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          <div className="space-y-4">
            {[
              { icon: "phone" as const, t: "Call or WhatsApp", v: site.phoneDisplay, href: `tel:${site.phone}` },
              { icon: "mail" as const, t: "Email", v: site.email, href: `mailto:${site.email}` },
              { icon: "pin" as const, t: "Visit", v: `${site.address.street}, ${site.address.locality}, ${site.address.country}`, href: `https://www.google.com/maps?q=${site.geo.lat},${site.geo.lng}` },
              { icon: "clock" as const, t: "Hours", v: site.hoursDisplay },
            ].map((c) => (
              <div key={c.t} className="flex gap-4 rounded-2xl border border-ink-100 p-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Icon name={c.icon} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm text-ink-500">{c.t}</p>
                  {c.href ? (
                    <a href={c.href} className="break-words font-semibold text-ink-900 hover:text-brand-600">{c.v}</a>
                  ) : (
                    <p className="font-semibold text-ink-900">{c.v}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-3xl border border-ink-100 bg-white p-6 shadow-sm sm:p-8">
            <ContactForms services={services.map((s) => s.title)} initialService={service} initialTab={tab === "message" ? "message" : "quote"} />
          </div>
        </div>
      </section>
    </>
  );
}
