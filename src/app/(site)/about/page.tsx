import type { Metadata } from "next";
import { CtaBand, Eyebrow, PageHero } from "@/components/Blocks";
import { Icon, type IconName } from "@/components/Icon";
import { JsonLd, breadcrumbLd } from "@/lib/jsonld";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "About Aptus Group: Nairobi Logistics & Safe Custody",
  description:
    "Aptus Group is a Nairobi logistics company in the JKIA Cargo Transit Zone offering freight forwarding, customs clearance, warehousing and safe custody across East Africa.",
  alternates: { canonical: "/about" },
};

const values: { icon: IconName; t: string; d: string }[] = [
  { icon: "shield", t: "Safe", d: "Goods are inspected, sealed and insured. Access is logged and limited." },
  { icon: "lock", t: "Secure", d: "Release only against original ID, with written authority for representatives." },
  { icon: "truck", t: "Always delivered", d: "We plan every move end to end and keep you updated at each step." },
];

export default function AboutPage() {
  return (
    <>
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "About", path: "/about" }])} />
      <PageHero
        eyebrow="About us"
        title="Our passion is what happens after the delivery"
        intro="We are a Nairobi logistics and safe custody company. Our job is to make moving and storing goods in East Africa predictable."
      />
      <section className="py-16">
        <div className="container-x grid gap-12 lg:grid-cols-2">
          <div className="space-y-4 text-lg leading-relaxed text-ink-600">
            <Eyebrow>Who we are</Eyebrow>
            <h2 className="font-display text-3xl font-extrabold text-ink-900">Based at JKIA, working across the region</h2>
            <p className="text-ink-500">
              {site.name} operates from the {site.address.street} in {site.address.locality}. Being next to Jomo Kenyatta
              International Airport lets us receive air cargo quickly, clear it and either deliver it or keep it in secure
              custody.
            </p>
            <p className="text-ink-500">
              We work with importers, exporters, businesses and individuals in Kenya, Uganda, Tanzania, Rwanda, South Sudan and
              DR Congo. Clients can follow every step online with a private tracking code.
            </p>
          </div>
          <div className="grid gap-4">
            {values.map((v) => (
              <div key={v.t} className="flex gap-4 rounded-2xl border border-ink-100 p-6">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Icon name={v.icon} className="h-6 w-6" />
                </span>
                <div>
                  <h3 className="font-display text-lg font-bold text-ink-900">{v.t}</h3>
                  <p className="text-ink-500">{v.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <CtaBand />
    </>
  );
}
