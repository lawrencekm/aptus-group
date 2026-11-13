// Tiny frontmatter reader shared by the admin UI and the API.
// An uploaded shipment file can look like:
//
// ---
// title: 8 cases, sealed wooden pallet
// holder: Jane Wanjiku
// origin: Kampala, Uganda
// destination: Nairobi, Kenya
// service: Safe Custody
// status: Received
// reference: CUST-0042
// ---
// # Shipment notes
// Free-form **markdown** shown on the public tracking page.

export type ShipmentMeta = Partial<{
  title: string;
  holder: string;
  origin: string;
  destination: string;
  service: string;
  status: string;
  reference: string;
  location: string;
}>;

const KEYS = new Set(["title", "holder", "origin", "destination", "service", "status", "reference", "location"]);
const ALIASES: Record<string, string> = {
  name: "holder",
  owner: "holder",
  depositor: "holder",
  from: "origin",
  to: "destination",
  ref: "reference",
};

export function parseFrontmatter(src: string): { meta: ShipmentMeta; body: string } {
  const text = src.replace(/^﻿/, "").replace(/\r\n/g, "\n");
  const m = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return { meta: {}, body: text.trim() };
  const meta: Record<string, string> = {};
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^\s*([A-Za-z_]+)\s*:\s*(.*)$/);
    if (!kv) continue;
    let key = kv[1].toLowerCase();
    key = ALIASES[key] ?? key;
    if (!KEYS.has(key)) continue;
    meta[key] = kv[2].trim().replace(/^["']|["']$/g, "");
  }
  return { meta: meta as ShipmentMeta, body: m[2].trim() };
}
