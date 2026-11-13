import { faqs, services, site } from "./site";

const dayMap: Record<string, string> = {
  Monday: "https://schema.org/Monday",
  Tuesday: "https://schema.org/Tuesday",
  Wednesday: "https://schema.org/Wednesday",
  Thursday: "https://schema.org/Thursday",
  Friday: "https://schema.org/Friday",
  Saturday: "https://schema.org/Saturday",
  Sunday: "https://schema.org/Sunday",
};

export function organizationLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${site.url}/#org`,
        name: site.name,
        legalName: site.legalName,
        url: site.url,
        logo: `${site.url}/icon.svg`,
        email: site.email,
        telephone: site.phone,
        slogan: site.tagline,
        description: site.description,
        areaServed: site.areaServed.map((name) => ({ "@type": "Place", name })),
        contactPoint: [
          {
            "@type": "ContactPoint",
            telephone: site.phone,
            email: site.email,
            contactType: "customer service",
            areaServed: "KE",
            availableLanguage: ["English", "Swahili"],
          },
        ],
      },
      {
        "@type": ["LocalBusiness", "MovingCompany"],
        "@id": `${site.url}/#business`,
        name: site.name,
        url: site.url,
        image: `${site.url}/opengraph-image`,
        telephone: site.phone,
        email: site.email,
        priceRange: "$$",
        parentOrganization: { "@id": `${site.url}/#org` },
        address: {
          "@type": "PostalAddress",
          streetAddress: site.address.street,
          addressLocality: site.address.locality,
          addressRegion: site.address.region,
          postalCode: site.address.postalCode,
          addressCountry: site.address.countryCode,
        },
        geo: { "@type": "GeoCoordinates", latitude: site.geo.lat, longitude: site.geo.lng },
        hasMap: `https://www.google.com/maps?q=${site.geo.lat},${site.geo.lng}`,
        openingHoursSpecification: site.hours.map((h) => ({
          "@type": "OpeningHoursSpecification",
          dayOfWeek: h.days.map((d) => dayMap[d]),
          opens: h.opens,
          closes: h.closes,
        })),
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "Logistics and safe custody services",
          itemListElement: services.map((s) => ({
            "@type": "Offer",
            itemOffered: { "@type": "Service", name: s.title, description: s.short, url: `${site.url}/services#${s.slug}` },
          })),
        },
      },
      {
        "@type": "WebSite",
        "@id": `${site.url}/#website`,
        url: site.url,
        name: site.name,
        publisher: { "@id": `${site.url}/#org` },
        inLanguage: "en-KE",
      },
    ],
  };
}

export function faqLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export function breadcrumbLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: `${site.url}${it.path}`,
    })),
  };
}

export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify output is safe here; escape "<" to avoid closing the script tag.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
