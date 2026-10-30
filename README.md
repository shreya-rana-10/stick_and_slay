# Stick & Slay

A product website for magnetic earrings — "The ear-piercing look. No piercing needed."
Built per the Stick & Slay PRD v1.0: a website that collects **order requests**
(no cart, no online payment), managed manually by the owner through a private admin area.

**Stack:** Next.js (App Router, TypeScript) · Tailwind CSS · Neon Postgres · Vercel

## Pages

| Route | Purpose |
| --- | --- |
| `/` | Brand hero, featured designs, how-it-works, FAQ preview |
| `/designs` | Catalogue (active products; unavailable ones shown greyed, not orderable) |
| `/product/[slug]` | Product detail with "Request this design" |
| `/how-it-works` | Wearing/removal steps, care & safety |
| `/faq` | PIERCING / FIT / ORDER / PAYMENT / DELIVERY / CARE answers |
| `/order` | Order request form (product, qty, name, phone, optional email, address, city, PIN, note, consent) |
| `/thank-you` | Unique reference code + what happens next |
| `/privacy` | Privacy notice |
| `/admin` | Owner login → Orders dashboard: search, status filter, pagination |
| `/admin/orders/[id]` | Order detail: contact + delivery + WhatsApp shortcut, status update, internal notes |

## APIs

| Endpoint | Notes |
| --- | --- |
| `GET /api/products` | Active catalogue only |
| `GET /api/products/[slug]` | 404 if missing/inactive |
| `POST /api/order-requests` | Full server validation, availability check, one request per submit, returns public ref (201) |
| `POST /api/admin/login` | scrypt hash check, rate-limited, generic failure message |
| `POST /api/admin/logout` | Clears session |
| `GET /api/admin/orders` | Admin-only; search (+ref/name/phone), status filter, pagination |
| `GET /api/admin/orders/[id]` | Admin-only detail incl. notes |
| `PATCH /api/admin/orders/[id]` | Admin-only status change / internal note append |

## Data model (Neon Postgres)

- `products(id, name, slug, description, price_inr, image_url, category, is_active, created_at, updated_at)`
- `order_requests(id, public_ref, customer_name, phone, email, address, city, pincode, product_id, product_name_snapshot, price_snapshot, quantity, customer_note, status, created_at, updated_at)`
- `order_notes(id, order_request_id, note, created_at, created_by)`
- `admins(id, email, password_hash, created_at)`

**Price convention:** stored as **integer rupees** (`₹199` → `199`). Switch to paise
only if fractional prices are ever introduced (PRD §7 documents the choice).

**Privacy:** `public_ref` (e.g. `SS-K7M2QX`) is the only identifier customers see;
sequential DB ids are never exposed. Timestamps stored UTC, displayed in IST.

## Anti-spam / safety

- Client + server validation ("validate twice"), honeypot field, 5 orders/min/IP,
  8 login attempts / 10 min/IP (best-effort, per serverless instance).
- Admin session = HMAC-signed HttpOnly cookie (`ADMIN_SESSION_SECRET`), 7-day expiry.

## Local development

```bash
npm install
# .env.local (gitignored) needs:
#   DATABASE_URL=postgresql://...neon.tech/neondb?sslmode=require...
#   ADMIN_SESSION_SECRET=<random hex>
node scripts/setup-db.mjs   # idempotent: schema + seed + admin bootstrap
npm run dev
```

If local DNS refuses to resolve the Neon hostname (as on this machine), also set:
`DATABASE_HOSTADDR=<pooler IP>` and `DATABASE_SERVERNAME=<neon hostname>` —
never set these on Vercel (the pooler IP can rotate).

### Owner / admin account

```bash
node scripts/setup-db.mjs                                   # first run: creates admin, prints password
ADMIN_EMAIL=you@example.com node scripts/setup-db.mjs --create   # add account with your email
ADMIN_PASSWORD='new-pass' node scripts/setup-db.mjs              # reset password
```

Default bootstrap account: `owner@stickandslay.app` (**change this email** before launch).

## Deployment (Vercel)

Env vars needed in Vercel: `DATABASE_URL`, `ADMIN_SESSION_SECRET` (all environments).
Production deploys run via CLI (same as zomato-lite): `npx vercel deploy --prod --yes`.
To enable push-to-deploy from GitHub, install the Vercel GitHub App and run
`npx vercel git connect https://github.com/<owner>/<repo>` once in the dashboard.

## Tests

```bash
npm run build                                    # type + build check
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\smoke-test.ps1 -BaseUrl http://localhost:3000
node scripts/admin-smoke.mjs <BaseUrl> <adminEmail> <password>
```

The page/API smoke test creates ONE clearly-marked test order (status `cancelled`,
noted "Automated smoke test — safe to ignore").

## Before launch (owner TODOs — PRD §16)

- Replace `lib/site.ts` placeholders: real contact email, Instagram URL, WhatsApp number.
- Replace `/public/products/*.svg` placeholders with **real product photography**
  (front + on-ear, WebP/AVIF, compressed).
- Confirm materials/magnet specs & care copy ("published only after verifying").
- Decide delivery regions/charges, returns/refunds/cancellation rules (FAQ copy updated then).
- Confirm prices + availability; keep every design under ₹299 (see `lib/site.ts` `priceCapInr`).
