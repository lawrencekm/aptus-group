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
// passport_id: A1234567      <- any receipt field (see receipt-fields.ts)
// ---
// # Shipment notes
// Free-form **markdown** shown on the public tracking page.

import { RECEIPT_KEYS, type ReceiptData } from "./receipt-fields";

export type ShipmentMeta = Partial<{
  title: string;
  holder: string;
  origin: string;
  destination: string;
  service: string;
  status: string;
  reference: string;
  location: string;
}> & { receipt?: ReceiptData };

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
  const receipt: ReceiptData = {};
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^\s*([A-Za-z_]+)\s*:\s*(.*)$/);
    if (!kv) continue;
    const value = kv[2].trim().replace(/^["']|["']$/g, "");
    const raw = kv[1].toLowerCase();
    if (RECEIPT_KEYS.has(raw)) {
      if (value) receipt[raw] = value;
      continue;
    }
    const key = ALIASES[raw] ?? raw;
    if (!KEYS.has(key)) continue;
    meta[key] = value;
  }
  const out = meta as ShipmentMeta;
  if (Object.keys(receipt).length) out.receipt = receipt;
  return { meta: out, body: m[2].trim() };
}
