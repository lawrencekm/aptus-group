import { describe, expect, it } from "vitest";
import { mkdirSync, writeFileSync } from "fs";
import { PDFDocument } from "pdf-lib";
import { parseFrontmatter } from "@/lib/frontmatter";
import { ORDER_TEMPLATE, RECEIPT_FIELDS, cleanReceipt, maskValue } from "@/lib/receipt-fields";
import { pdfSafe, requestReceiptPdf, shipmentReceiptPdf } from "@/lib/pdf";

const shipment = {
  trackingNumber: "AG-261114-7KQ2",
  code: "K7QM29XDPA",
  holder: "Hamadi Bin Asumani",
  status: "In Safe Custody" as const,
  title: "2 sealed document cases",
  service: "Safe Custody & Safe Keeping",
  createdAt: "2026-11-14T08:00:00.000Z",
  updatedAt: "2026-11-14T09:30:00.000Z",
  receipt: parseFrontmatter(ORDER_TEMPLATE).meta.receipt,
};

async function check(bytes: Uint8Array, name: string) {
  expect(Buffer.from(bytes.slice(0, 5)).toString()).toBe("%PDF-");
  const doc = await PDFDocument.load(bytes);
  if (process.env.WRITE_PDF) {
    mkdirSync(".data/test-output", { recursive: true });
    writeFileSync(`.data/test-output/${name}.pdf`, bytes);
  }
  return doc;
}

describe("order template + frontmatter", () => {
  it("fills shipment fields, receipt fields and notes from the template", () => {
    const { meta, body } = parseFrontmatter(ORDER_TEMPLATE);
    expect(meta.title).toBe("2 sealed document cases");
    expect(meta.status).toBe("In Safe Custody");
    expect(meta.receipt?.passport_id).toBe("A0000000");
    expect(meta.receipt?.bonded_fee).toBe("0.00");
    expect(body).toContain("## Contents");
  });

  it("only uses known receipt keys and every template key is a real field", () => {
    const { meta } = parseFrontmatter("---\ntitle: x\nevil_key: 1\nqty: 3\n---\nbody");
    expect(meta.receipt).toEqual({ qty: "3" });
    const keys = new Set(RECEIPT_FIELDS.map((f) => f.key));
    for (const k of Object.keys(parseFrontmatter(ORDER_TEMPLATE).meta.receipt ?? {})) expect(keys.has(k)).toBe(true);
  });

  it("cleans receipt input from the API", () => {
    expect(cleanReceipt({ qty: " 5 ", nope: "x", fragile: 3, contents: "" })).toEqual({ qty: "5" });
    expect(cleanReceipt(null)).toEqual({});
  });

  it("masks private values", () => {
    expect(maskValue("OP0089272")).toBe("•••••9272");
    expect(maskValue("123")).toBe("••••");
  });
});

describe("PDF receipts", () => {
  it("renders the Safe Keeping Receipt", async () => {
    const doc = await check(await shipmentReceiptPdf(shipment), "safe-keeping-receipt");
    expect(doc.getPageCount()).toBe(1);
    expect(doc.getTitle()).toBe("Safe Keeping Receipt AG-261114-7KQ2");
  });

  it("renders the masked public copy", async () => {
    await check(await shipmentReceiptPdf(shipment, { masked: true }), "safe-keeping-receipt-masked");
  });

  it("survives unicode, emoji and very long values (multi-page)", async () => {
    const long = "Quarantine – “sanitary” inspection… 🚚 ".repeat(40);
    const doc = await check(
      await shipmentReceiptPdf({ ...shipment, receipt: { ...shipment.receipt, comments: long, contents: "Gold (AU) ≥ 99.9% 金" } }),
      "safe-keeping-receipt-long"
    );
    expect(doc.getPageCount()).toBeGreaterThanOrEqual(1);
  });

  it("renders quote and contact request receipts", async () => {
    const base = { id: "abc123def", ref: "RQ-261114-7KQ2", at: "2026-11-14T08:00:00.000Z", name: "Jane", phone: "+254700000000", email: "jane@example.com" };
    const q = await check(await requestReceiptPdf({ ...base, kind: "quote", service: "Air Freight", details: "2 pallets from Dubai" }), "request-quote");
    expect(q.getTitle()).toBe("Request Receipt RQ-261114-7KQ2");
    await check(await requestReceiptPdf({ ...base, kind: "contact", service: "Collection", details: "When can I collect?" }), "request-contact");
  });

  it("maps characters the standard fonts cannot draw", () => {
    expect(pdfSafe("“A” – B… 🚚")).toBe('"A" - B... ??');
  });
});
