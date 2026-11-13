import type { ShipmentStatus } from "./site";

export type ShipmentEvent = {
  id: string;
  at: string; // ISO
  status: ShipmentStatus;
  location?: string;
  note?: string;
};

export type Shipment = {
  id: string;
  code: string; // public access code, also the URL segment: /t/{code}
  trackingNumber: string; // human-readable reference shown on receipts
  title: string;
  holder: string;
  reference?: string;
  service: string;
  origin?: string;
  destination?: string;
  status: ShipmentStatus;
  markdown: string;
  /** Safe Keeping Receipt fields (see receipt-fields.ts). */
  receipt?: Record<string, string>;
  events: ShipmentEvent[];
  createdAt: string;
  updatedAt: string;
  views: number;
  lastViewedAt?: string;
};

export type ActivityKind =
  | "auth.otp_sent"
  | "auth.login"
  | "auth.failed"
  | "auth.logout"
  | "shipment.created"
  | "shipment.updated"
  | "shipment.status"
  | "shipment.deleted"
  | "shipment.code_rotated"
  | "shipment.viewed"
  | "track.miss"
  | "quote.received"
  | "contact.received"
  | "shipment.receipt_sent"
  | "bot.blocked";

export type Activity = {
  id: string;
  at: string;
  kind: ActivityKind;
  message: string;
  ip?: string;
  ref?: string; // shipment id or quote id
};

/** A request from the public site: a quote request or a contact message. */
export type Quote = {
  id: string;
  /** Human reference printed on the request receipt, e.g. RQ-261114-7KQ2 */
  ref?: string;
  kind?: "quote" | "contact";
  at: string;
  name: string;
  phone: string;
  email?: string;
  /** Service for quotes, subject for contact messages. */
  service: string;
  details: string;
  handled?: boolean;
};
