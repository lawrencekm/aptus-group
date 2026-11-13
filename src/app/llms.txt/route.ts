// Plain-language summary for AI assistants and answer engines (generative engine optimisation).
// See https://llmstxt.org
import { faqs, services, site } from "@/lib/site";

export const dynamic = "force-static";

export function GET() {
  const body = `# ${site.name}

> ${site.description}

## Key facts
- Name: ${site.name}
- What: logistics, freight forwarding, customs clearance, bonded warehousing and safe custody (safe keeping)
- Where: ${site.address.street}, ${site.address.locality}, ${site.address.country} (next to Jomo Kenyatta International Airport, JKIA)
- Coordinates: ${site.geo.lat}, ${site.geo.lng}
- Areas served: ${site.areaServed.join(", ")}
- Phone / WhatsApp: ${site.phoneDisplay}
- Email: ${site.email}
- Hours: ${site.hoursDisplay}
- Shipment tracking: ${site.url}/track (enter the private tracking code from your receipt)

## Services
${services.map((s) => `- [${s.title}](${site.url}/services#${s.slug}): ${s.body}`).join("\n")}

## Pages
- [Home](${site.url}/)
- [Services](${site.url}/services)
- [Safe custody](${site.url}/safe-custody)
- [Track a shipment](${site.url}/track)
- [About](${site.url}/about)
- [Contact and quotes](${site.url}/contact)

## FAQ
${faqs.map((f) => `### ${f.q}\n${f.a}`).join("\n\n")}
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
