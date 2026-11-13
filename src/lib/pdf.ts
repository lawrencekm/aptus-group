// PDF documents: the Safe Keeping Receipt for shipments, and a request receipt for
// quote / contact submissions. Pure functions (no server-only imports) so they are unit-tested.
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage, type RGB } from "pdf-lib";
import QRCode from "qrcode";
import { RECEIPT_CERTIFY, RECEIPT_NOTE, RECEIPT_ROWS, maskValue, type ReceiptField } from "./receipt-fields";
import { site } from "./site";
import type { Quote, Shipment } from "./types";

const A4: [number, number] = [595.28, 841.89];
const M = 34; // page margin
const RED = rgb(0.941, 0.267, 0.18); // brand #f0442e
const GOLD = rgb(0.886, 0.69, 0.29); // #e2b04a
const INK = rgb(0.055, 0.078, 0.125); // #0e1420
const GREY = rgb(0.37, 0.42, 0.49);
const LINE = rgb(0.8, 0.83, 0.88);

type Fonts = { regular: PDFFont; bold: PDFFont };

/** Standard PDF fonts only cover WinAnsi; map common Unicode punctuation and drop the rest. */
export function pdfSafe(text: string): string {
  return text
    .replace(/[‘’‛]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—−]/g, "-")
    .replace(/…/g, "...")
    .replace(/[•·]/g, "*")
    .replace(/ /g, " ")
    .replace(/[\r\t]/g, " ")
    .replace(/[^\n\x20-\x7E¡-ÿ]/g, "?");
}

function wrap(text: string, font: PDFFont, size: number, width: number): string[] {
  const lines: string[] = [];
  for (const para of pdfSafe(text).split("\n")) {
    let line = "";
    for (const word of para.split(/\s+/).filter(Boolean)) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= width) {
        line = candidate;
        continue;
      }
      if (line) lines.push(line);
      // Break words that are longer than the cell on their own.
      let w = word;
      while (font.widthOfTextAtSize(w, size) > width) {
        let i = w.length;
        while (i > 1 && font.widthOfTextAtSize(w.slice(0, i), size) > width) i--;
        lines.push(w.slice(0, i));
        w = w.slice(i);
      }
      line = w;
    }
    lines.push(line);
  }
  return lines;
}

function centred(page: PDFPage, text: string, y: number, font: PDFFont, size: number, color: RGB = INK) {
  const t = pdfSafe(text);
  const w = font.widthOfTextAtSize(t, size);
  page.drawText(t, { x: (page.getWidth() - w) / 2, y, size, font, color });
}

/** Faint globe watermark, echoing the original receipt's background. */
function globe(page: PDFPage, cx: number, cy: number, r: number) {
  const opacity = 0.13;
  page.drawCircle({ x: cx, y: cy, size: r, borderColor: GOLD, borderWidth: 1.2, borderOpacity: opacity, opacity: 0.04, color: GOLD });
  for (const k of [0.25, 0.55, 0.82]) {
    page.drawEllipse({ x: cx, y: cy, xScale: r * k, yScale: r, borderColor: GOLD, borderWidth: 0.8, borderOpacity: opacity });
    page.drawEllipse({ x: cx, y: cy, xScale: r, yScale: r * k, borderColor: GOLD, borderWidth: 0.8, borderOpacity: opacity });
  }
  page.drawLine({ start: { x: cx - r, y: cy }, end: { x: cx + r, y: cy }, thickness: 0.8, color: GOLD, opacity });
  page.drawLine({ start: { x: cx, y: cy - r }, end: { x: cx, y: cy + r }, thickness: 0.8, color: GOLD, opacity });
}

/** Draws the letterhead and returns the y position below it. */
function letterhead(page: PDFPage, f: Fonts): number {
  const W = page.getWidth();
  let y = page.getHeight() - M;

  // Logo: three columns on a red tile (same mark as the website).
  const s = 34;
  const lx = (W - s) / 2;
  const ly = y - s;
  page.drawRectangle({ x: lx, y: ly, width: s, height: s, color: RED });
  page.drawRectangle({ x: lx + 7.5, y: ly + 7.5, width: 4.5, height: 14.5, color: rgb(1, 1, 1) });
  page.drawRectangle({ x: lx + 15, y: ly + 7.5, width: 4.5, height: 19, color: rgb(1, 1, 1) });
  page.drawRectangle({ x: lx + 22.5, y: ly + 7.5, width: 4.5, height: 12, color: GOLD });
  y = ly - 10;
  centred(page, "SAFE. SECURE. ALWAYS DELIVERED.", y, f.bold, 6.5, GOLD);
  y -= 24;
  centred(page, "APTUS GROUP", y, f.bold, 24);
  y -= 12;
  page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 0.5, color: LINE });
  y -= 14;
  centred(page, `${site.address.street}, ${site.address.locality}, Kenya`, y, f.regular, 10.5, RED);
  y -= 14;
  centred(page, `Tel: ${site.phoneDisplay}, Email: ${site.email}, ${site.url.replace(/^https?:\/\//, "www.").replace("www.www.", "www.")}`, y, f.regular, 8.5, RED);
  y -= 10;
  page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 0.5, color: LINE });
  return y - 22;
}

type Cell = { label: string; value: string; span: number; boldLabel?: boolean };

/**
 * Renders rows of label/value cells in a 4-column bordered table.
 * Starts a new page when a row does not fit. Returns the final page and y.
 */
function table(doc: PDFDocument, startPage: PDFPage, startY: number, rows: Cell[][], f: Fonts): { page: PDFPage; y: number } {
  let page = startPage;
  let y = startY;
  const W = page.getWidth() - 2 * M;
  const col = W / 4;
  const pad = 4;
  const LS = 7.5; // label size
  const VS = 9.5; // value size

  for (const row of rows) {
    const layouts = row.map((c) => {
      const w = col * c.span - pad * 2;
      const label = wrap(c.label + (c.value ? ":" : ""), c.boldLabel ? f.bold : f.regular, LS, w);
      const value = c.value ? wrap(c.value, f.bold, VS, w) : [];
      return { c, w, label, value, h: pad * 2 + label.length * (LS + 1.5) + value.length * (VS + 2) };
    });
    const h = Math.max(22, ...layouts.map((l) => l.h));
    if (y - h < M + 40) {
      page = doc.addPage(A4);
      y = page.getHeight() - M;
    }
    let x = M;
    for (const l of layouts) {
      const cw = col * l.c.span;
      page.drawRectangle({ x, y: y - h, width: cw, height: h, borderColor: LINE, borderWidth: 0.6 });
      let ty = y - pad - LS;
      for (const line of l.label) {
        page.drawText(line, { x: x + pad, y: ty, size: LS, font: l.c.boldLabel ? f.bold : f.regular, color: l.c.boldLabel ? INK : GREY });
        ty -= LS + 1.5;
      }
      ty -= 1;
      for (const line of l.value) {
        page.drawText(line, { x: x + pad, y: ty - 1, size: VS, font: f.bold, color: INK });
        ty -= VS + 2;
      }
      x += cw;
    }
    y -= h;
  }
  return { page, y };
}

async function qr(doc: PDFDocument, url: string) {
  const png = await QRCode.toBuffer(url, { type: "png", margin: 0, width: 220, errorCorrectionLevel: "M", color: { dark: "#0e1420", light: "#ffffff" } });
  return doc.embedPng(png);
}

const dateFmt = (iso: string) =>
  new Intl.DateTimeFormat("en-KE", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Nairobi" }).format(new Date(iso));

async function newDoc(title: string) {
  const doc = await PDFDocument.create();
  doc.setTitle(pdfSafe(title));
  doc.setAuthor(site.name);
  doc.setCreator(`${site.name} (${site.url})`);
  doc.setProducer(site.name);
  const fonts: Fonts = { regular: await doc.embedFont(StandardFonts.Helvetica), bold: await doc.embedFont(StandardFonts.HelveticaBold) };
  return { doc, fonts };
}

/**
 * Safe Keeping Receipt for a shipment.
 * `masked` hides identity numbers (used when the document is opened with just a tracking code).
 */
export async function shipmentReceiptPdf(
  s: Pick<Shipment, "trackingNumber" | "code" | "holder" | "status" | "createdAt" | "updatedAt" | "title" | "service" | "receipt">,
  opts: { masked?: boolean; siteUrl?: string } = {}
): Promise<Uint8Array> {
  const no = s.trackingNumber;
  const { doc, fonts } = await newDoc(`Safe Keeping Receipt ${no}`);
  const page = doc.addPage(A4);
  let y = letterhead(page, fonts);

  centred(page, `SAFE KEEPING RECEIPT.     No: ${no}`, y, fonts.bold, 17);
  y -= 26;
  centred(page, `BONDED DECLARATION SKR FORM - ${no}`, y, fonts.bold, 12, rgb(0.2, 0.2, 0.2));
  y -= 16;

  globe(page, page.getWidth() / 2, y - 250, 230);

  const data: Record<string, string> = { holder_name: s.holder, ...(s.receipt ?? {}) };
  const value = (f: ReceiptField) => {
    const v = data[f.key] ?? "";
    return v && opts.masked && f.private ? maskValue(v) : v;
  };
  const rows: Cell[][] = RECEIPT_ROWS.map((r) => r.map((f) => ({ label: f.label, value: value(f), span: f.span ?? 1 })));
  // Labels without values still print (as on the paper form), so the holder sees what is blank.
  rows.push([
    { label: RECEIPT_CERTIFY, value: "", span: 2, boldLabel: true },
    { label: "Date and Holder's Signature (16)", value: "", span: 2 },
  ]);
  rows.push([{ label: RECEIPT_NOTE, value: "", span: 4 }]);

  const t = table(doc, page, y, rows, fonts);
  let p = t.page;
  y = t.y - 14;

  // Footer: customs form reference + live tracking block with QR code.
  const url = `${(opts.siteUrl ?? site.url).replace(/\/$/, "")}/t/${s.code}`;
  if (y < M + 92) {
    p = doc.addPage(A4);
    y = p.getHeight() - M;
  }
  p.drawText("Customs Declaration Form (KCD/CBWH/JKIA)", { x: M, y, size: 8.5, font: fonts.regular, color: GREY });
  y -= 12;
  const img = await qr(doc, url);
  const q = 62;
  p.drawRectangle({ x: M, y: y - q - 12, width: p.getWidth() - 2 * M, height: q + 12, color: rgb(0.96, 0.97, 0.98) });
  p.drawImage(img, { x: M + 6, y: y - q - 6, width: q, height: q });
  const tx = M + q + 18;
  p.drawText("Track this shipment", { x: tx, y: y - 16, size: 10, font: fonts.bold, color: INK });
  p.drawText(pdfSafe(url), { x: tx, y: y - 30, size: 9, font: fonts.regular, color: RED });
  p.drawText(pdfSafe(`Code: ${s.code}    Status: ${s.status}    Issued: ${dateFmt(s.createdAt)}    Updated: ${dateFmt(s.updatedAt)}`), {
    x: tx,
    y: y - 44,
    size: 8,
    font: fonts.regular,
    color: GREY,
  });
  if (opts.masked) {
    p.drawText("Identity numbers are partly hidden on copies downloaded with a tracking code.", { x: tx, y: y - 56, size: 7, font: fonts.regular, color: GREY });
  }
  return doc.save();
}

/** Acknowledgement for a quote request or contact message. */
export async function requestReceiptPdf(q: Quote): Promise<Uint8Array> {
  const no = q.ref || q.id;
  const isQuote = q.kind !== "contact";
  const { doc, fonts } = await newDoc(`Request Receipt ${no}`);
  const page = doc.addPage(A4);
  let y = letterhead(page, fonts);

  centred(page, `REQUEST RECEIPT.     No: ${no}`, y, fonts.bold, 17);
  y -= 26;
  centred(page, isQuote ? "QUOTE REQUEST ACKNOWLEDGEMENT" : "CONTACT MESSAGE ACKNOWLEDGEMENT", y, fonts.bold, 12, rgb(0.2, 0.2, 0.2));
  y -= 16;
  globe(page, page.getWidth() / 2, y - 120, 150);

  const rows: Cell[][] = [
    [
      { label: "Reference", value: no, span: 1 },
      { label: "Date received", value: dateFmt(q.at), span: 1 },
      { label: "Type", value: isQuote ? "Quote request" : "Contact message", span: 1 },
      { label: isQuote ? "Service" : "Subject", value: q.service, span: 1 },
    ],
    [
      { label: "Name", value: q.name, span: 2 },
      { label: "Phone", value: q.phone || "-", span: 1 },
      { label: "Email", value: q.email || "-", span: 1 },
    ],
    [{ label: isQuote ? "Request details" : "Message", value: q.details, span: 4 }],
    [
      {
        label:
          "This confirms that Aptus Group received your request. Our team replies within one working day. This document is not a quotation, invoice or safe keeping receipt. Quote the reference above when you contact us.",
        value: "",
        span: 4,
      },
    ],
  ];
  const t = table(doc, page, y, rows, fonts);
  let yy = t.y - 18;
  t.page.drawText(pdfSafe(`${site.name} - ${site.phoneDisplay} - ${site.email} - ${site.url}`), { x: M, y: yy, size: 8.5, font: fonts.regular, color: GREY });
  yy -= 12;
  t.page.drawText(pdfSafe(`Office hours: ${site.hoursDisplay}`), { x: M, y: yy, size: 8.5, font: fonts.regular, color: GREY });
  return doc.save();
}
