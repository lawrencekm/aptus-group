# Aptus Group website

[![CI](https://github.com/lawrencekm/aptus-group/actions/workflows/ci.yml/badge.svg)](https://github.com/lawrencekm/aptus-group/actions/workflows/ci.yml)

Next.js (App Router) rebuild of aptusgroup.net: a marketing site for logistics and safe custody, public shipment tracking by private code with PDF Safe Keeping Receipts, bot-protected quote and contact forms, and a single password-protected admin page.

## What's in it

| Area | Path | Notes |
|---|---|---|
| Marketing site | `/`, `/services`, `/safe-custody`, `/about`, `/contact` | SEO metadata, JSON‑LD (Organization, LocalBusiness with geo, Service, FAQ, Breadcrumbs), Open Graph image |
| Tracking | `/track` → `/t/{CODE}` → `/t/{CODE}/receipt` | Code is a random 10‑char string (no names in URLs). Pages are `noindex` and rate‑limited per IP. The PDF Safe Keeping Receipt follows the original SKR form; passport/email/phone are partly masked on the public copy |
| Quote & contact | `/contact` | Proof-of-work bot check + honeypot + time trap + rate limits. Each request gets a reference and a PDF request receipt; the office inbox (and the customer, if they gave an email) get it by email |
| Admin | `/admin` (login at `/admin/login`) | Password from `ADMIN_PASSWORD` (SMS one-time codes remain available with `AUTH_MODE=otp`). New orders start from an editable template; all SKR receipt fields; edit, delete, copy link/code/message, timeline updates, rotate code, receipt PDF, **send receipt by email** (PDF attached), inbox, live activity feed |
| GEO / AI search | `/llms.txt`, `/sitemap.xml`, `/robots.txt` | `geo.*` / ICBM meta tags, plain‑language facts for answer engines |

Company details (phone, address, coordinates, hours, services, FAQs) all live in `src/lib/site.ts`.

## Shipment markdown format

New orders open pre-filled from the template in `src/lib/receipt-fields.ts` (also downloadable from the editor). Upload a `.md` file (or paste) in the admin; frontmatter fills the form, including any receipt field (`passport_id`, `contents`, `qty`, `bonded_fee`, …):

```md
---
title: 2 sealed document cases
holder: Jane Wanjiku
origin: Kampala, Uganda
destination: Nairobi, Kenya
service: Safe Custody & Safe Keeping
status: In Safe Custody      # Booked | Received | In Safe Custody | In Transit | At Customs | Out for Delivery | Delivered | Released | On Hold
reference: CUST-0042
location: Main warehouse, JKIA
---
## Contents
Anything here is rendered on the public tracking page (GitHub‑flavoured markdown; raw HTML and images are ignored).
```

## Tests and CI

```bash
npm test            # vitest: bot check, receipt PDFs, template parsing, auth
npm run typecheck
```

GitHub Actions (`.github/workflows/ci.yml`) runs typecheck, tests and a production build on every push and pull request. Set `WRITE_PDF=1` to save the sample PDFs to `.data/test-output/`.

## Run locally

Requires Node.js 20.9+.

```bash
npm install
cp .env.example .env.local   # set SESSION_SECRET; keep SMS_PROVIDER=console
npm run dev
```

Sign in at `/admin/login` with `ADMIN_PASSWORD`. Without Redis credentials, data is stored in `.data/store.json`; without SMTP/Resend, emails are saved to `.data/outbox/`.

## Deploy to Vercel

1. Push this folder to a Git repo and import it in Vercel.
2. **Storage → Marketplace → Upstash Redis** → connect to the project (sets `KV_REST_API_URL` / `KV_REST_API_TOKEN`).
3. Environment variables: `SESSION_SECRET` (e.g. `openssl rand -base64 48`), `ADMIN_PASSWORD`, and email: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` (Gmail App Password) or `RESEND_API_KEY`, optional `MAIL_TO`/`MAIL_FROM`.
4. Add the domain `aptusgroup.net` and submit `https://aptusgroup.net/sitemap.xml` in Google Search Console. Create/claim the Google Business Profile at the same address so the map listing matches the site's structured data.

## Security notes

- Login: password compared in constant time; 8 tries per 15 min per IP and 40 per hour overall; every failure is logged. (SMS codes, if enabled: HMAC‑hashed, 5‑minute expiry, 5 tries, send limits.)
- Public forms: signed single-use proof-of-work challenge (~65k SHA-256 hashes, solved invisibly while the visitor types), minimum fill time, honeypot, 5 per hour per IP, 60 per hour overall, max 3 acknowledgement emails per address per day. Blocked attempts appear in the activity feed.
- Session: signed HS256 JWT in an `HttpOnly`, `Secure`, `SameSite=Strict` cookie (8 h), backed by a server-side session record so sign-out revokes it. Middleware + per-route checks, Origin check on mutating requests.
- Tracking codes: ~49 bits of randomness from an unambiguous alphabet; lookups limited to 30 per 10 min per IP; unknown-code attempts appear in the activity feed.
- All logins, failed codes, edits, deletes, public views and quote requests are logged in the activity feed (last 500 events).
