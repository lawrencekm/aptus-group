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
  | "quote.received";

export type Activity = {
  id: string;
  at: string;
  kind: ActivityKind;
  message: string;
  ip?: string;
  ref?: string; // shipment id or quote id
};

export type Quote = {
  id: string;
  at: string;
  name: string;
  phone: string;
  email?: string;
  service: string;
  details: string;
  handled?: boolean;
};
