import "server-only";
import { store } from "./store";
import { randomId, trackingCode } from "./security";
import { SHIPMENT_STATUSES, type ShipmentStatus } from "./site";
import type { Activity, ActivityKind, Quote, Shipment, ShipmentEvent } from "./types";

const K = {
  shipment: (id: string) => `shipment:${id}`,
  code: (code: string) => `code:${code}`,
  index: "shipments",
  activity: "activity",
  quotes: "quotes",
};

// ---------- activity ----------

export async function logActivity(kind: ActivityKind, message: string, extra: { ip?: string; ref?: string } = {}) {
  const a: Activity = { id: randomId(8), at: new Date().toISOString(), kind, message, ...extra };
  try {
    await store().lpush(K.activity, a, 500);
  } catch (e) {
    console.error("activity log failed", e);
  }
}

export async function listActivity(count = 200): Promise<Activity[]> {
  return store().lrange<Activity>(K.activity, count);
}

// ---------- shipments ----------

export function isStatus(s: unknown): s is ShipmentStatus {
  return typeof s === "string" && (SHIPMENT_STATUSES as readonly string[]).includes(s);
}

async function uniqueCode(): Promise<string> {
  for (let i = 0; i < 8; i++) {
    const c = trackingCode();
    if (!(await store().get(K.code(c)))) return c;
  }
  throw new Error("Could not allocate a unique tracking code");
}

function ymd(): string {
  const d = new Date();
  return `${String(d.getUTCFullYear()).slice(2)}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;
}

function trackingNumber(): string {
  return `AG-${ymd()}-${trackingCode(4)}`;
}

export type ShipmentInput = {
  title: string;
  holder: string;
  reference?: string;
  service: string;
  origin?: string;
  destination?: string;
  status: ShipmentStatus;
  markdown: string;
  location?: string;
  note?: string;
  receipt?: Record<string, string>;
};

export async function createShipment(input: ShipmentInput): Promise<Shipment> {
  const now = new Date().toISOString();
  const id = randomId(9);
  const code = await uniqueCode();
  const first: ShipmentEvent = {
    id: randomId(6),
    at: now,
    status: input.status,
    location: input.location,
    note: input.note || "Shipment registered",
  };
  const s: Shipment = {
    id,
    code,
    trackingNumber: trackingNumber(),
    title: input.title,
    holder: input.holder,
    reference: input.reference,
    service: input.service,
    origin: input.origin,
    destination: input.destination,
    status: input.status,
    markdown: input.markdown,
    receipt: input.receipt,
    events: [first],
    createdAt: now,
    updatedAt: now,
    views: 0,
  };
  await store().set(K.shipment(id), s);
  await store().set(K.code(code), id);
  await store().sadd(K.index, id);
  return s;
}

export async function getShipment(id: string): Promise<Shipment | null> {
  return store().get<Shipment>(K.shipment(id));
}

export async function getShipmentByCode(code: string): Promise<Shipment | null> {
  const id = await store().get<string>(K.code(code));
  return id ? getShipment(id) : null;
}

export async function listShipments(): Promise<Shipment[]> {
  const ids = await store().smembers(K.index);
  const all = await Promise.all(ids.map((id) => getShipment(id)));
  return all
    .filter((s): s is Shipment => !!s)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function saveShipment(s: Shipment): Promise<Shipment> {
  s.updatedAt = new Date().toISOString();
  await store().set(K.shipment(s.id), s);
  return s;
}

export async function addEvent(s: Shipment, ev: Omit<ShipmentEvent, "id" | "at"> & { at?: string }): Promise<Shipment> {
  const e: ShipmentEvent = { id: randomId(6), at: ev.at || new Date().toISOString(), status: ev.status, location: ev.location, note: ev.note };
  s.events = [...s.events, e].sort((a, b) => a.at.localeCompare(b.at));
  s.status = s.events[s.events.length - 1].status;
  return saveShipment(s);
}

export async function removeEvent(s: Shipment, eventId: string): Promise<Shipment> {
  s.events = s.events.filter((e) => e.id !== eventId);
  if (s.events.length) s.status = s.events[s.events.length - 1].status;
  return saveShipment(s);
}

export async function rotateCode(s: Shipment): Promise<Shipment> {
  const old = s.code;
  s.code = await uniqueCode();
  await store().set(K.code(s.code), s.id);
  await store().del(K.code(old));
  return saveShipment(s);
}

export async function deleteShipment(s: Shipment): Promise<void> {
  await store().del(K.code(s.code));
  await store().del(K.shipment(s.id));
  await store().srem(K.index, s.id);
}

/** Records a public view. Logs to the activity feed at most once per 30 minutes per shipment. */
export async function recordView(s: Shipment, ip: string): Promise<void> {
  const last = s.lastViewedAt ? Date.parse(s.lastViewedAt) : 0;
  s.views = (s.views || 0) + 1;
  s.lastViewedAt = new Date().toISOString();
  // Do not bump updatedAt for views, so the admin list order reflects real edits.
  await store().set(K.shipment(s.id), s);
  if (Date.now() - last > 30 * 60 * 1000) {
    await logActivity("shipment.viewed", `Tracking page opened for ${s.trackingNumber}`, { ip, ref: s.id });
  }
}

// ---------- quotes ----------

export async function addQuote(q: Omit<Quote, "id" | "at" | "ref">): Promise<Quote> {
  const id = randomId(8);
  const quote: Quote = { id, ref: `RQ-${ymd()}-${trackingCode(4)}`, at: new Date().toISOString(), ...q };
  await store().lpush(K.quotes, quote, 300);
  await store().set(`request:${id}`, quote, 60 * 60 * 24 * 365);
  return quote;
}

/** Looks up one public request (for its PDF receipt). */
export async function getQuote(id: string): Promise<Quote | null> {
  return store().get<Quote>(`request:${id}`);
}

export async function listQuotes(count = 100): Promise<Quote[]> {
  return store().lrange<Quote>(K.quotes, count);
}
