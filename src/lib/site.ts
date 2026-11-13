// Single source of truth for company details used across pages, SEO and JSON-LD.
// Edit here and every page, the sitemap, structured data and llms.txt update together.

export const site = {
  name: "Aptus Group",
  legalName: "Aptus Group",
  tagline: "Safe. Secure. Always delivered.",
  description:
    "Aptus Group is a Nairobi logistics and safe custody company in the JKIA Cargo Transit Zone, Airport North Road. We handle air and sea freight, customs clearance, bonded warehousing and insured safe keeping, with online shipment tracking.",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "https://aptusgroup.net").replace(/\/$/, ""),
  phone: "+254101631676",
  phoneDisplay: "+254 101 631 676",
  whatsapp: "254101631676",
  email: "logisticsaptusgroup@gmail.com",
  address: {
    street: "Cargo Transit Zone, Airport North Road",
    locality: "Nairobi",
    region: "Nairobi County",
    regionCode: "KE-30",
    postalCode: "00501",
    country: "Kenya",
    countryCode: "KE",
  },
  // Approximate position of the JKIA cargo area on Airport North Road. Confirm with the client.
  geo: { lat: -1.3197, lng: 36.9256 },
  hours: [
    { days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "08:00", closes: "18:00" },
    { days: ["Saturday"], opens: "09:00", closes: "14:00" },
  ],
  hoursDisplay: "Mon–Fri 8:00–18:00 · Sat 9:00–14:00 (EAT)",
  areaServed: ["Kenya", "Uganda", "Tanzania", "Rwanda", "South Sudan", "DR Congo", "East Africa"],
  keywords: [
    "logistics company Nairobi",
    "safe custody Nairobi",
    "safe keeping Kenya",
    "bonded warehouse JKIA",
    "freight forwarding Kenya",
    "customs clearance JKIA",
    "air cargo Nairobi",
    "shipment tracking Kenya",
    "secure storage valuables Nairobi",
  ],
} as const;

export type ServiceIcon = "shield" | "warehouse" | "plane" | "ship" | "stamp" | "truck";

export const services: { slug: string; title: string; short: string; body: string; icon: ServiceIcon }[] = [
  {
    slug: "safe-custody",
    title: "Safe Custody & Safe Keeping",
    short: "Insured, access-controlled custody for documents, valuables and high-value cargo.",
    body: "Sealed, catalogued and insured storage in a monitored facility near JKIA. Every deposit gets a reference, a private tracking code and a release process that needs the depositor's original ID.",
    icon: "shield",
  },
  {
    slug: "bonded-warehousing",
    title: "Bonded Warehousing",
    short: "Store goods under customs bond and pay duty only when you release them.",
    body: "Keep imported goods in a bonded facility while you arrange paperwork, buyers or onward transit. Duty is due when goods are released into the local market.",
    icon: "warehouse",
  },
  {
    slug: "air-freight",
    title: "Air Freight",
    short: "Import and export air cargo through Jomo Kenyatta International Airport.",
    body: "Consolidated and express air cargo, with booking, handling and documentation from our base in the JKIA cargo zone.",
    icon: "plane",
  },
  {
    slug: "sea-freight",
    title: "Sea Freight",
    short: "FCL and LCL ocean freight through the Port of Mombasa.",
    body: "Full and shared container shipping, with inland haulage from Mombasa to Nairobi and onward across the region.",
    icon: "ship",
  },
  {
    slug: "customs-clearance",
    title: "Customs Clearance",
    short: "Declarations, duties and release handled by licensed agents.",
    body: "Import and export declarations, tariff classification, duty calculation and release, so goods do not sit at the port or airport.",
    icon: "stamp",
  },
  {
    slug: "regional-transport",
    title: "Regional Transport & Last Mile",
    short: "Road haulage across East Africa and door-to-door delivery in Nairobi.",
    body: "Trucking along the Northern Corridor to Uganda, Rwanda, South Sudan and DR Congo, plus same-day delivery within Nairobi.",
    icon: "truck",
  },
];

export const faqs: { q: string; a: string }[] = [
  {
    q: "How do I track my shipment with Aptus Group?",
    a: "Open the Track page and enter the tracking code on your receipt, or open the private link we sent you. The page shows the current status, location history and notes from our team.",
  },
  {
    q: "Where is Aptus Group located?",
    a: "We are in the Cargo Transit Zone on Airport North Road, Nairobi, next to Jomo Kenyatta International Airport (JKIA).",
  },
  {
    q: "What is safe custody or safe keeping?",
    a: "Safe custody means we store your documents, valuables or cargo in a secure, insured facility and release them only to you or someone you have authorised in writing.",
  },
  {
    q: "How do I collect goods held in safe custody?",
    a: "Give us at least 24 hours' notice. Bring your original ID or passport and your receipt. If someone else is collecting, they need your written authority and a copy of your ID.",
  },
  {
    q: "How do I contact Aptus Group?",
    a: "Call or WhatsApp +254 101 631 676, or email logisticsaptusgroup@gmail.com. Our office is open Monday to Friday 8:00 to 18:00 and Saturday 9:00 to 14:00.",
  },
  {
    q: "Do you clear goods through customs at JKIA and Mombasa?",
    a: "Yes. Our team prepares import and export declarations, calculates duties and arranges release at JKIA and the Port of Mombasa.",
  },
];

export const SHIPMENT_STATUSES = [
  "Booked",
  "Received",
  "In Safe Custody",
  "In Transit",
  "At Customs",
  "Out for Delivery",
  "Delivered",
  "Released",
  "On Hold",
] as const;
export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number];

// Steps shown on the public progress bar. "In Safe Custody" maps onto "Received",
// "Released" onto "Delivered", and "On Hold" is shown as a flag.
export const PROGRESS_STEPS = ["Booked", "Received", "In Transit", "At Customs", "Out for Delivery", "Delivered"] as const;

export function progressIndex(status: ShipmentStatus): number {
  const mapped = status === "In Safe Custody" ? "Received" : status === "Released" ? "Delivered" : status;
  return PROGRESS_STEPS.indexOf(mapped as (typeof PROGRESS_STEPS)[number]);
}
