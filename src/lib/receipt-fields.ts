// Fields of the Safe Keeping Receipt / Bonded Declaration (SKR) form, modelled on the
// receipt Aptus has issued historically. Shared by the admin editor, markdown frontmatter
// and the PDF generator. Keys are snake_case so they can be written directly in frontmatter.

export type ReceiptField = {
  key: string;
  label: string;
  /** Grid columns the cell spans on the PDF (out of 4). */
  span?: 1 | 2 | 3 | 4;
  /** Text box instead of a single-line input in the admin editor. */
  long?: boolean;
  /** Sensitive identity data: masked on the public download. */
  private?: boolean;
};

export type ReceiptRow = ReceiptField[];

/** Rows exactly as they are laid out on the printed receipt (4 columns). */
export const RECEIPT_ROWS: ReceiptRow[] = [
  [
    { key: "holder_name", label: "Holder's Name" },
    { key: "holder_customs_ref", label: "Holder's Custom Ref (if any)" },
    { key: "insurance_number", label: "Insurance Number" },
    { key: "passport_id", label: "Passport ID No", private: true },
  ],
  [
    { key: "insured_value", label: "Insured Value" },
    { key: "taxable_value", label: "Taxable Value" },
    { key: "cif_value", label: "CIF Value", span: 2 },
  ],
  [
    { key: "company", label: "Company" },
    { key: "company_address", label: "Address" },
    { key: "company_town", label: "State/Province/Town" },
    { key: "company_country", label: "Country" },
  ],
  [
    { key: "email", label: "Email", private: true },
    { key: "tel", label: "Tel", private: true },
    { key: "fax", label: "Fax", span: 2 },
  ],
  [
    { key: "declaring_company", label: "Declaring Company", span: 2 },
    { key: "declaring_address", label: "Address", span: 2 },
  ],
  [
    { key: "declaring_town", label: "State/Province/Town" },
    { key: "declaring_country", label: "Country" },
    { key: "trade_documents", label: "Export/Import Documents (if any)", span: 2 },
  ],
  [
    { key: "keeping_location", label: "Safe Keeping Location" },
    { key: "keeping_address", label: "Address" },
    { key: "keeping_city", label: "City" },
    { key: "importer_contact", label: "Importer Tel/Fax/Email (Consignment Holder)", private: true },
  ],
  [
    { key: "contents", label: "Description of Contents (1)" },
    { key: "qty", label: "Qty (2)" },
    { key: "volume_weight", label: "Volume Wt (4)" },
    { key: "net_weight", label: "Net Weight (3)" },
  ],
  [
    { key: "tariff_number", label: "CD Tariff Number (7)" },
    { key: "country_of_origin", label: "Country of Origin of Goods (9)" },
    { key: "value_usd", label: "Value (US $) (5)", span: 2 },
  ],
  [
    { key: "priority", label: "Priority" },
    { key: "perishable", label: "Perishable" },
    { key: "documents", label: "Documents", span: 2 },
  ],
  [
    { key: "gross_weight", label: "Total Gross Wt (6)" },
    { key: "bonded_fee", label: "Bonded Fee (8)" },
    { key: "storage_fee", label: "CD Storage Fees (10)", span: 2 },
  ],
  [
    { key: "returned_goods", label: "Returned Goods" },
    { key: "commercial_samples", label: "Commercial Samples" },
    { key: "hazardous", label: "Hazardous" },
    { key: "fragile", label: "Fragile" },
  ],
  [
    { key: "comments", label: "Comments (12) e.g. goods subject to quarantine, sanitary, physical inspection or other restrictions", span: 2, long: true },
    { key: "holder_instructions", label: "Holder's Instruction in case of reference" },
    { key: "customs_officer", label: "Customs Officer and Date" },
  ],
  [
    { key: "license_numbers", label: "License Number(s) (13)" },
    { key: "certificate_numbers", label: "Certificate Number(s) (14)" },
    { key: "invoice_number", label: "Invoice Number (15)", span: 2 },
  ],
];

export const RECEIPT_FIELDS: ReceiptField[] = RECEIPT_ROWS.flat();
export const RECEIPT_KEYS = new Set(RECEIPT_FIELDS.map((f) => f.key));

export const RECEIPT_NOTE =
  "NOTE: Items subjected to delay or expiry of collection date will be subjected to holder expense for extra storage fee (20).";
export const RECEIPT_CERTIFY =
  "I certify that the particulars given in this customs declaration are correct and that these items do not contain any dangerous items prohibited by the Customs regulation.";

export type ReceiptData = Record<string, string>;

/** Keeps only known receipt keys, trimmed and length-limited. */
export function cleanReceipt(input: unknown): ReceiptData {
  const out: ReceiptData = {};
  if (!input || typeof input !== "object") return out;
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    if (!RECEIPT_KEYS.has(k) || typeof v !== "string") continue;
    const s = v.trim().slice(0, 400);
    if (s) out[k] = s;
  }
  return out;
}

/** Masks all but the last 4 characters, for documents opened with only a tracking code. */
export function maskValue(v: string): string {
  if (v.length <= 4) return "••••";
  return `${"•".repeat(Math.min(v.length - 4, 6))}${v.slice(-4)}`;
}

/**
 * Template every new order starts from. Admins edit the values rather than
 * starting from an empty form; frontmatter keys fill the form automatically.
 */
export const ORDER_TEMPLATE = `---
title: 2 sealed document cases
holder: Jane Wanjiku
service: Safe Custody & Safe Keeping
status: In Safe Custody
origin: Kampala, Uganda
destination: Nairobi, Kenya
reference: CUST-0042
location: Main Warehouse, JKIA
holder_customs_ref: APTU-0042
insurance_number: EBM/00000/2026
passport_id: A0000000
insured_value: 0.00
company: Aptus Group
company_address: Airport North Road, Nairobi
company_town: Airport North Road, Nairobi
company_country: Kenya
email: n/a
declaring_company: Aptus Group
declaring_address: Nairobi
declaring_town: Nairobi
declaring_country: Kenya
trade_documents: NA
keeping_location: Main Warehouse
keeping_address: Airport North Road
keeping_city: Nairobi
contents: Document cases (sealed)
qty: 2
volume_weight: 4.00
country_of_origin: Uganda, Kampala
value_usd: 0.00
documents: Yes
bonded_fee: 0.00
storage_fee: 0.00
hazardous: 0
fragile: 0
holder_instructions: -
license_numbers: DTL0000/2026
certificate_numbers: EAC/0000-26
invoice_number: TBC
---
## Contents
| Item | Qty | Notes |
|------|-----|-------|
| Document case | 2 | Sealed, seal nos. 00412–00413 |

## Release conditions
- 24 hours' written notice
- Original ID of the depositor
`;
