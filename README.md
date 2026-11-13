# Aptus Group website

Next.js (App Router) rebuild of aptusgroup.net: a marketing site for logistics and safe custody, public shipment tracking by private code, and a single SMS‑OTP‑protected admin page.

## What's in it

| Area | Path | Notes |
|---|---|---|
| Marketing site | `/`, `/services`, `/safe-custody`, `/about`, `/contact` | SEO metadata, JSON‑LD (Organization, LocalBusiness with geo, Service, FAQ, Breadcrumbs), Open Graph image |
| Tracking | `/track` → `/t/{CODE}` | Code is a random 10‑char string (no names in URLs). Pages are `noindex` and rate‑limited per IP |
| Admin | `/admin` (login at `/admin/login`) | SMS one‑time code to a single phone (`ADMIN_PHONE`). Create shipments from markdown, edit, delete, copy link/code/message, timeline updates, rotate code, quote inbox, live activity feed |
| GEO / AI search | `/llms.txt`, `/sitemap.xml`, `/robots.txt` | `geo.*` / ICBM meta tags, plain‑language facts for answer engines |

Company details (phone, address, coordinates, hours, services, FAQs) all live in `src/lib/site.ts`.

## Shipment markdown format

Upload a `.md` file (or paste) in the admin. Optional frontmatter fills the form:

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

## Run locally

Requires Node.js 20.9+.

```bash
npm install
cp .env.example .env.local   # set SESSION_SECRET; keep SMS_PROVIDER=console
npm run dev
```

With `SMS_PROVIDER=console` the login code is printed in the terminal running `npm run dev`. Without Redis credentials, data is stored in `.data/store.json`.

## Deploy to Vercel

1. Push this folder to a Git repo and import it in Vercel.
2. **Storage → Marketplace → Upstash Redis** → connect to the project (sets `KV_REST_API_URL` / `KV_REST_API_TOKEN`).
3. Environment variables: `NEXT_PUBLIC_SITE_URL`, `ADMIN_PHONE`, `SESSION_SECRET` (e.g. `openssl rand -base64 48`), `SMS_PROVIDER` (`sozuri` or `africastalking`) plus that provider's keys and `SMS_SENDER_ID`.
4. Add the domain `aptusgroup.net` and submit `https://aptusgroup.net/sitemap.xml` in Google Search Console. Create/claim the Google Business Profile at the same address so the map listing matches the site's structured data.

## Security notes

- Login: 6‑digit code, HMAC‑hashed at rest, 5‑minute expiry, 5 wrong tries then invalidated, send limits (1 per 45 s, 6 per hour), verify limits per IP.
- Session: signed HS256 JWT in an `HttpOnly`, `Secure`, `SameSite=Strict` cookie (8 h), backed by a server-side session record so sign-out revokes it. Middleware + per-route checks, Origin check on mutating requests.
- Tracking codes: ~49 bits of randomness from an unambiguous alphabet; lookups limited to 30 per 10 min per IP; unknown-code attempts appear in the activity feed.
- All logins, failed codes, edits, deletes, public views and quote requests are logged in the activity feed (last 500 events).
