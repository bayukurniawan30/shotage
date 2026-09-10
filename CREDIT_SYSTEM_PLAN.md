# Shotage Credit System: Product and Implementation Plan

## 1. Goal and product boundary

Introduce pay-as-you-go credits for the official Shotage export workflow while keeping
the editor easy to try and iterate in.

Shotage renders exports in the browser. A browser-side credit check cannot prevent a
visitor from taking a screenshot, using developer tools, or reproducing a canvas
export. Credits therefore pay for the supported high-quality export experience,
account history, and convenience; they are not a DRM mechanism. Product copy and
success metrics should reflect that boundary.

### Product principles

- A user should understand the cost before starting an export.
- Retrying a failed export or correcting an immediate mistake must not feel punitive.
- The server is the source of truth for identity, balances, and the credit ledger.
- Payments and deductions must be safe to retry without duplicate credits or charges.

## 2. Recommended v1 offer

Use the high-perceived-value model initially, but treat its prices as a testable
hypothesis rather than a proven market optimum.

| Export                     | Credit cost | $10 / 2,000-credit pack equivalent |
| -------------------------- | ----------: | ---------------------------------: |
| Standard image (1x / 2x)   |          15 |     about 133 images ($0.075 each) |
| 4K image (4x)              |          30 |       about 66 images ($0.15 each) |
| Short video (5–10 seconds) |          75 |       about 26 videos ($0.38 each) |
| Long video (11–60 seconds) |         120 |       about 16 videos ($0.62 each) |

Offer these initial packs:

| Pack     | Price | Credits | Intended customer       |
| -------- | ----: | ------: | ----------------------- |
| Starter  |    $5 |     900 | Occasional creator      |
| Popular  |   $10 |   2,000 | Regular product builder |
| Pro Pack |   $25 |   6,000 | Agency or power user    |

Give each newly registered account 100 non-expiring welcome credits. At the proposed
prices this provides six standard image exports, three 4K exports, or one short video
plus a standard image.

### Immediate re-export protection

Permit a no-cost retry for the same user within five minutes when all of the following
match: the canonical project snapshot hash, export kind, scale, format, and stage
scope. This must be decided by the server from ledger data, not only in client state.

The user should see the applicable cost before exporting, for example: `PNG (2x):
15 credits — balance 1,850 → 1,835`. A protected retry should explicitly say it is
free. Decide and document separately whether clipboard copies count as an export;
v1 should charge them the same as a downloaded image or leave them free consistently.

## 3. Chosen v1 stack

This repository uses React + Vite on the client, with a Hono application exported from
the root [index.ts](index.ts) and deployed as a Vercel function. The API plan must use
that Hono application; this is not a Next.js application.

Use the following v1 choices unless a business requirement changes them:

- **Identity and database:** Neon Auth and Neon Postgres.
- **Payments:** Polar Checkout and Polar webhooks.
- **Hosting/API:** Vercel and the existing Hono routes in `index.ts`.
- **UI system:** [Untitled UI React](https://www.untitledui.com/react/docs/introduction),
  alongside the existing React and Tailwind styling.

Polar is the Merchant of Record, so it handles sales-tax, VAT, and GST obligations for
supported sales. Use it for payment collection and payment lifecycle events; Neon
Postgres remains the authority for Shotage credit balances. Do not implement two auth
providers or two payment providers in the same initial release.

Configure Neon Auth with Google, GitHub, and email magic-link sign-in. These three
methods cover the intended creator/developer audience without adding password-reset
or password-storage work to v1. Configure a production email provider and test the
magic-link callback for every allowed production and preview origin.

Use Untitled UI components and patterns for the sign-in prompt, credit-balance pill,
top-up drawer, checkout launch state, transaction-history drawer, insufficient-credit
modal, and export-cost confirmation. Keep Polar's embedded checkout inside the
Shotage UI shell, but do not restyle or duplicate its payment fields.

## 4. System design

```text
Browser (React/Vite)
  ├─ reads authenticated balance
  ├─ requests an export reservation
  ├─ performs local canvas/video rendering
  └─ settles the reservation or lets it expire
              │
              ▼
Hono API in index.ts (Vercel)
  ├─ verifies Neon Auth session; derives user ID server-side
  ├─ calls Postgres RPCs for balance and ledger operations
  ├─ creates Polar Checkout sessions
  └─ verifies and idempotently processes Polar webhooks
              │
              ▼
Neon Postgres
  ├─ profiles and authoritative balance
  ├─ append-only credit ledger
  ├─ export reservations / settlements
  └─ processed Polar event and order identifiers
```

### API endpoints

| Endpoint                                    | Purpose                                                                                                                                |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/user/credits`                     | Return the authenticated user’s current balance.                                                                                       |
| `GET /api/user/purchases`                   | Return the authenticated user’s latest credit-pack purchases and statuses.                                                             |
| `POST /api/export/reservations`             | Authorize and reserve credits for one export using an idempotency key. Returns a reservation and whether typo protection made it free. |
| `POST /api/export/reservations/:id/settle`  | Mark a completed local export as settled. Safe to retry.                                                                               |
| `POST /api/export/reservations/:id/release` | Release a failed or cancelled export reservation. Safe to retry and subject to abuse controls.                                         |
| `POST /api/checkout/create`                 | Create a Polar Checkout session for a fixed, server-selected pack.                                                                     |
| `POST /api/webhooks/polar`                  | Verify Polar’s webhook signature and credit a completed order exactly once.                                                            |

Never accept a client-provided user ID, price, credit amount, or pack quantity. The
server derives the authenticated user and calculates all credit costs from an allowlist.

## 5. Data model and invariants

`profiles.credits_balance` is a cached, authoritative balance and
`credit_transactions` is the append-only audit ledger. Only trusted server-side RPCs
may update either one. Enable Neon Auth-backed RLS policies: clients may read only
their own profile and ledger entries; clients may insert or update neither balances
nor transactions. Keep credit tables in the application schema rather than altering
Neon Auth's managed `neon_auth` schema.

```sql
create table public.profiles (
  id text primary key,
  email text,
  credits_balance integer not null default 100 check (credits_balance >= 0),
  created_at timestamptz not null default now()
);

create table public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.profiles(id) on delete cascade,
  amount integer not null check (amount <> 0),
  action_type text not null,
  description text,
  idempotency_key text unique,
  provider text,
  provider_event_id text,
  provider_order_id text,
  export_reservation_id uuid,
  project_hash text,
  created_at timestamptz not null default now()
);

create unique index credit_transactions_one_purchase_per_order
  on public.credit_transactions (provider, provider_order_id)
  where action_type = 'pack_purchase';

create table public.credit_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.profiles(id) on delete cascade,
  checkout_id text not null unique,
  order_id text unique,
  product_id text not null,
  pack_slug text not null,
  credits integer not null check (credits > 0),
  removed_credits integer not null default 0,
  amount integer,
  refunded_amount integer not null default 0,
  currency text,
  status text not null check (
    status in ('pending', 'paid', 'partially_refunded', 'refunded', 'failed', 'expired')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  paid_at timestamptz,
  refunded_at timestamptz
);

create table public.export_reservations (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.profiles(id) on delete cascade,
  idempotency_key text not null unique,
  project_hash text not null,
  export_kind text not null,
  export_format text not null,
  export_scale integer not null,
  stage_scope text not null,
  credit_amount integer not null check (credit_amount >= 0),
  status text not null check (status in ('reserved', 'settled', 'released')),
  expires_at timestamptz not null,
  settled_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.payment_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_event_id text not null,
  provider_order_id text,
  event_type text not null,
  processed_at timestamptz not null default now(),
  unique (provider, provider_event_id)
);
```

Implement transactional Postgres RPCs, not application-side read-then-write logic:

1. Lock the user profile row with `FOR UPDATE`.
2. Resolve an existing idempotency key before creating work.
3. Detect a qualifying five-minute retry from settled exports.
4. Verify the balance, create the reservation and matching negative ledger row, and
   reduce the balance in the same transaction.
5. Settle a valid reservation idempotently. Automatically release expired, unsettled
   reservations through a scheduled job, returning credits with a linked positive
   ledger entry.

Polar webhook processing must verify the signature over the unparsed raw request body.
Store both Polar event IDs and order IDs with unique constraints before crediting,
because Polar may resend events. Credit only the verified, paid one-time product that
the server created. The checkout success redirect is a user-experience signal only;
it must never grant credits.

## 6. Export flow

1. User selects an export in `src/components/ExportModal.tsx`.
2. The modal displays the server-defined cost and current balance.
3. Client generates a UUID idempotency key and a canonical hash of the export-relevant
   project state; it requests a reservation.
4. If the reservation succeeds, the client runs the current browser-local canvas or
   video export.
5. On a successful download/copy, the client settles the reservation. If rendering,
   encoding, downloading, or cancellation fails, it releases the reservation.
6. If the browser closes or loses connectivity, the reservation expires and an
   automated server-side job refunds it. The UI can recover a pending reservation on
   the next authenticated session.

Do not rely on optimistic client-only balance updates. Optimistic UI is acceptable only
after a successful reservation response and must be reconciled with the server balance.

## 7. Authentication and payment flow

- Add Neon Auth sign-in with Google, GitHub, and email magic links.
- Create a profile and one `signup_bonus` ledger entry through a database trigger or
  trusted server-side onboarding RPC. It must be idempotent.
- Require an authenticated session for paid-quality exports. Show the welcome-credit
  sign-up prompt only when an unauthenticated visitor chooses an export that requires
  credits.
- Let the client request a named pack only; the server maps that name to a Polar
  one-time-product ID and records the authenticated user in server-created checkout
  metadata. Never accept a browser-supplied product ID or credit quantity.
- Polar’s paid-order webhook, rather than the success redirect, grants credits.
- Use Polar's customer portal for official receipts and payment-management needs. Keep
  a user-facing Shotage purchase history in `credit_purchases`, backed by the immutable
  `credit_transactions` audit ledger.

## 8. Policy decisions required before launch

- Do purchased and promotional credits expire? Recommended v1: no expiry.
- How are refunds, chargebacks, disputed payments, and promotional grants represented
  in the ledger and balance?
- Is there a free, watermarked, or lower-resolution export option for anonymous users?
- What qualifies for free retry protection across multi-stage and video exports?
- Does copying an image to the clipboard consume credits?
- What support policy applies when the client reports success but the browser blocks a
  download?

## 9. Delivery roadmap

### Phase 0 — product and operational decisions

Choose the policies above, the exact packs, export cost table, and the free-export
positioning. Define success metrics: checkout conversion, exports per purchaser,
repeat purchase rate, failed-export rate, refund/support rate, and credit abuse rate.

### Phase 1 — account and ledger foundation

Integrate Neon Auth; add RLS, profiles, ledger, reservations, idempotent RPCs,
and authenticated balance endpoint. Test concurrent deductions, duplicate requests,
and unauthorized database/API access.

### Phase 2 — payment foundation

Create server-controlled Polar Checkout sessions, authenticated purchase history, and a
raw-body, signature-verified Hono webhook. Test duplicate webhook delivery, cancelled
or expired checkout, completed order, and refund/chargeback handling. Start in Polar's
sandbox and configure production, preview, and localhost origins before launch.

### Phase 3 — export integration

Update `ExportModal.tsx` to request, settle, and release reservations around the
existing local image and video export paths. Add balance display, error recovery, and
five-minute retry messaging. Test rendering failure and browser refresh scenarios.

### Phase 4 — billing UX and observability

Add the header balance pill, top-up UI, detailed ledger history, support tooling, expired
reservation cleanup, structured logs, and monitoring/alerts for failed webhooks and
reservation releases.

## 10. Launch checklist

- [ ] Authenticated identity is verified server-side for every protected endpoint.
- [ ] RLS prevents client-side balance and ledger mutation.
- [ ] Each balance mutation occurs through one atomic database transaction.
- [ ] Checkout pack and credit amount are server-controlled.
- [ ] Polar webhook signatures are verified from the raw body; event/order IDs are unique.
- [ ] Export reservations, retries, settlements, and expiry refunds are idempotent.
- [ ] Pricing, free-retry rules, copying policy, and refund/chargeback policy are
      visible to users and support staff.
- [ ] Neon Auth Google, GitHub, magic-link email, and trusted-origin settings are
      configured for production and previews.
- [ ] Production environment variables, Polar webhook endpoint, and allowed embedded
      checkout origins are configured in Vercel and Polar.

## 11. Implementation specification

This section is the execution contract for an implementation agent. Items marked
**[REVIEW]** are proposed defaults that require product-owner approval before their
phase begins. The agent must implement one phase at a time, run its acceptance tests,
and stop for review before proceeding to the next phase.

### 11.1 Source-of-truth boundaries

| Data                                           | Authoritative system      | Notes                                                          |
| ---------------------------------------------- | ------------------------- | -------------------------------------------------------------- |
| Users, sessions, OAuth identities              | Neon Auth                 | Never duplicate credentials in application tables.             |
| Credit balance, ledger, reservations           | Neon Postgres             | All mutations use transactional server-side functions.         |
| Products, prices, paid orders, refunds         | Polar                     | Payment state enters Shotage only through verified webhooks.   |
| Pack title, artwork, marketing copy, FAQs      | Morphic CMS               | Presentation only; never determines credits or payment value.  |
| Explore designs and thumbnails                 | Morphic CMS               | Continue using the existing Explore integration.               |
| Pack-to-product and product-to-credit mapping  | Hono server configuration | Never read authoritative values from the browser or CMS.       |
| Authentication, credit, and checkout interface | Untitled UI React         | Keep behavior accessible and consistent with the existing app. |

The browser sends stable slugs such as `popular`, never a price, credit amount, or
Polar product ID. Hono resolves the slug using trusted server configuration. Morphic
CMS may contain matching display content, but a CMS change must not alter checkout or
credit behavior.

### 11.2 Packages and module boundaries

Use the current stable versions available when each phase starts and pin them in the
lockfile. Do not copy Next.js-only examples into this Vite + Hono application.

- Neon Auth React/Vite client from the current `@neondatabase/neon-js` Auth SDK.
- Neon serverless Postgres driver for Hono database access.
- `@polar-sh/hono` and `zod` for checkout/webhook integration and validation.
- Existing Untitled UI React components and `@untitledui/icons` for product UI.

Create small integration boundaries rather than importing provider SDKs throughout
the application:

```text
src/lib/auth/client.ts             Neon Auth browser client
src/server/auth.ts                 Hono authentication verification/middleware
src/server/db.ts                   Neon serverless database client
src/server/credits.ts              pricing rules and credit service
src/server/polar.ts                Polar product map and checkout configuration
src/server/routes/credits.ts       balance and reservation routes
src/server/routes/checkout.ts      checkout and customer portal routes
src/server/routes/webhooks.ts      Polar webhook route
src/components/credits/*           Untitled UI-based credit and billing UI
migrations/*                       versioned SQL schema, functions, and RLS policies
```

The root `index.ts` mounts these Hono route modules. Keep `src/server/index.ts` as the
Vite development-server entry that re-exports the same application.

### 11.3 Environment variables

Add names only to `.env.example`; real values remain in local secrets and Vercel.

| Variable                | Exposure | Purpose                                                                                            |
| ----------------------- | -------- | -------------------------------------------------------------------------------------------------- |
| `VITE_NEON_AUTH_URL`    | Browser  | Neon Auth URL for the active database branch.                                                      |
| `NEON_AUTH_BASE_URL`    | Server   | Neon Auth server endpoint, if required by the selected SDK flow.                                   |
| `NEON_AUTH_JWKS_URL`    | Server   | Optional exact JWKS URL; defaults to `<NEON_AUTH_BASE_URL>/.well-known/jwks.json`.                 |
| `DATABASE_URL`          | Server   | Pooled Neon Postgres connection string.                                                            |
| `UNLIMITED_USER_IDS`    | Server   | Optional comma-separated `user_profiles.user_id` allowlist for zero-cost creator/internal exports. |
| `POLAR_ACCESS_TOKEN`    | Server   | Polar organization access token.                                                                   |
| `POLAR_WEBHOOK_SECRET`  | Server   | Polar Standard Webhooks signing secret.                                                            |
| `POLAR_SERVER`          | Server   | Exactly `sandbox` or `production`; default to `sandbox` outside production.                        |
| `POLAR_PRODUCT_STARTER` | Server   | One-time Polar product ID for 900 credits.                                                         |
| `POLAR_PRODUCT_POPULAR` | Server   | One-time Polar product ID for 2,000 credits.                                                       |
| `POLAR_PRODUCT_PRO`     | Server   | One-time Polar product ID for 6,000 credits.                                                       |
| `APP_URL`               | Server   | Canonical origin used for trusted redirects.                                                       |
| `CRON_SECRET`           | Server   | Authenticates reservation-cleanup jobs.                                                            |

Existing Morphic CMS and Turnstile variables remain unchanged. Startup must fail with
a clear error when a required production-only secret or product mapping is missing.

### 11.4 Authentication contract

1. Configure Neon Auth Google, GitHub, and email magic-link providers.
2. Add production, preview, and local origins to Neon Auth's trusted origins and OAuth
   callback configuration.
3. The React client obtains the current Neon Auth session and includes its access token
   as `Authorization: Bearer <token>` for protected Hono API calls.
4. Hono cryptographically verifies the token using Neon Auth's documented verification
   flow. Validate signature, issuer, audience where applicable, and expiration; merely
   decoding a JWT is forbidden.
5. Hono derives `user_id` from the verified subject. No protected endpoint accepts a
   user ID from request JSON, query parameters, or client metadata.
6. An idempotent onboarding transaction creates `profiles` and a single +100
   `signup_bonus` ledger record on the user's first authenticated API request.

All protected API routes return `401` for a missing/invalid session and `403` only when
an authenticated user lacks permission. Authentication errors must never disclose
whether another user ID exists.

### 11.5 Server-owned pricing configuration

```ts
export const CREDIT_PACKS = {
  starter: { credits: 900, productEnv: 'POLAR_PRODUCT_STARTER' },
  popular: { credits: 2_000, productEnv: 'POLAR_PRODUCT_POPULAR' },
  pro: { credits: 6_000, productEnv: 'POLAR_PRODUCT_PRO' },
} as const;

export const EXPORT_COSTS = {
  image_standard: 15,
  image_4k: 30,
  video_short: 75,
  video_long: 120,
} as const;
```

**[REVIEW] Proposed charging rules:**

- Image cost is per rendered stage. Exporting all stages costs the per-image rate
  multiplied by the number of stages, with the total displayed before confirmation.
- Video cost uses total output duration: 1–10 seconds is short; 11–30 seconds is long.
- Clipboard copy costs the same as downloading the equivalent image.
- Purchased and promotional credits do not expire in v1.
- Anonymous users may edit and preview but must sign in to use the official export
  actions. The 100-credit welcome grant provides the trial.

### 11.6 Canonical project hash

The hash is used only to recognize an honest immediate retry; it is not a security
boundary. A modified client can reuse a hash, just as it can bypass a browser-local
export paywall.

Build the hash from export-relevant state after removing transient values such as
selection, open panels/modals, progress, timestamps, generated blob URLs, and local
database IDs. Recursively sort object keys, serialize with JSON, append export kind,
format, scale, stage scope, stage count, and video duration, then compute SHA-256 with
the Web Crypto API.

Only one zero-cost retry is allowed per paid, settled export. It must match the same
user and canonical hash and begin within five minutes of the original settlement.
Further retries create a new paid reservation.

### 11.7 API contracts

All JSON errors use:

```json
{
  "error": {
    "code": "INSUFFICIENT_CREDITS",
    "message": "You need 15 credits to export this image.",
    "requestId": "req_..."
  }
}
```

#### `GET /api/user/credits`

Response `200`:

```json
{
  "balance": 1850,
  "currency": "credits",
  "updatedAt": "2026-09-07T00:00:00.000Z"
}
```

#### `POST /api/export/reservations`

Request:

```json
{
  "idempotencyKey": "UUID generated once per export attempt",
  "projectHash": "SHA-256 hex string",
  "kind": "image",
  "format": "png",
  "scale": 2,
  "stageScope": "current",
  "stageCount": 1,
  "videoDurationSeconds": null
}
```

The server validates enums/ranges, derives the cost, and ignores unknown properties.
Response `201`, or `200` when replaying the same idempotency key:

```json
{
  "reservationId": "uuid",
  "status": "reserved",
  "creditAmount": 15,
  "protectedRetry": false,
  "balance": 1835,
  "expiresAt": "2026-09-07T00:30:00.000Z"
}
```

Return `409 INSUFFICIENT_CREDITS` with the unchanged balance when funds are insufficient.
Return `409 IDEMPOTENCY_CONFLICT` when an existing key is reused with a different body.

#### Settlement and release

`POST /api/export/reservations/:id/settle` and
`POST /api/export/reservations/:id/release` require an authenticated owner and an
operation idempotency key. A repeated operation returns the current reservation state.
Settling a released reservation or releasing a settled reservation returns `409`.

**[REVIEW] Reservations expire after 30 minutes.** The cleanup job releases expired
reservations in batches and writes linked positive refund transactions. Limit each
user to three simultaneous open reservations. Release attempts are logged and
rate-limited because client-reported failure cannot be treated as trusted evidence.

#### `POST /api/checkout/create`

Request: `{ "pack": "popular" }`.

The authenticated Hono handler maps the slug to a trusted Polar product ID and creates
a one-time checkout with the Neon Auth user ID as `customerExternalId` and internal
metadata and records a pending `credit_purchases` row. Response:
`{ "checkoutUrl": "https://...", "checkoutId": "..." }`. The client opens this URL in
Polar Checkout. Success and cancel return to `/purchases`; success shows “Confirming
payment” and polls with bounded retries until the webhook updates the ledger and history.

#### `POST /api/webhooks/polar`

Use `@polar-sh/hono` webhook verification with the untouched request body. Subscribe
to `order.paid`, `order.refunded`, `checkout.updated`, and `checkout.expired`. Grant credits
only for `order.paid` with `billing_reason = purchase` and a known one-time product ID.
Insert the payment event, credit transaction, and balance update atomically. Duplicate
event or order IDs return success without applying another balance change.

### 11.8 Refund and chargeback policy

**[REVIEW] Proposed v1 policy:** a full Polar refund removes the credits originally
granted by that order. If some credits have already been spent, reduce the balance to
zero, record the remaining amount as `credits_debt`, and block further exports until
newly purchased or manually granted credits clear the debt. A partial refund removes
credits proportionally using integer rounding documented in the transaction.

Implement this only after adding `credits_debt`, account billing status, and immutable
links between purchase/refund transactions and the Polar order. Never delete or edit
historical ledger rows to represent a refund.

### 11.9 Reservation state machine

```text
                    export succeeds
created → reserved ─────────────────→ settled
              │
              ├─ client failure/cancel → released
              │
              └─ cleanup after expiry  → released
```

Only the database transaction may perform a state transition. Each transition appends
or links a ledger row and returns the resulting balance. There is no transition out of
`settled` or `released`; corrections use new compensating ledger transactions.

### 11.10 UI state matrix

Use Untitled UI React patterns with keyboard navigation, visible focus, semantic labels,
and announced async status changes.

| State                              | Required UI behavior                                                                |
| ---------------------------------- | ----------------------------------------------------------------------------------- |
| Signed out                         | Show export cost and a sign-in action explaining the 100-credit welcome grant.      |
| Loading session/balance            | Disable paid actions and show a compact skeleton; do not display a guessed balance. |
| Ready                              | Show balance pill and explicit before/after cost in the export modal.               |
| Insufficient credits               | Replace confirmation with top-up options; preserve the user's export settings.      |
| Checkout opening                   | Disable duplicate checkout launches and show progress.                              |
| Checkout complete, webhook pending | Show “Confirming payment”; poll/refetch balance with bounded backoff.               |
| Payment confirmed                  | Refresh the purchase list and balance; show the paid purchase on `/purchases`.      |
| Payment failed/cancelled           | Preserve settings and offer retry without changing credits.                         |
| Export reserved/rendering          | Prevent duplicate clicks and show progress/cancel behavior.                         |
| Export failed                      | Request release, explain whether credits were restored, and provide a request ID.   |
| Protected retry                    | Display `Free retry` and the five-minute window before confirmation.                |

### 11.11 Acceptance tests

Authentication:

- Google, GitHub, and email magic-link sign-in work locally, in a Vercel preview, and
  in production.
- Missing, expired, malformed, and wrong-issuer tokens receive `401`.
- Two simultaneous first requests produce one profile and one welcome grant.

Credits and exports:

- Concurrent reservations cannot make a balance negative.
- Replaying the same idempotency key returns the original result without a second charge.
- Reusing a key with a different request returns an idempotency conflict.
- The first matching retry within five minutes is free; the second is charged.
- Settlement, release, and expiry are idempotent and create correct ledger entries.
- A user cannot access or mutate another user's reservation or credit history.

Polar:

- Sandbox checkout accepts only known pack slugs and server-owned product IDs.
- `order.created` or a success redirect does not grant credits.
- One verified `order.paid` grants the exact configured credits once.
- Replayed or out-of-order webhooks do not duplicate or reverse balances incorrectly.
- Full and partial refunds follow the approved debt/refund policy.
- Invalid webhook signatures return an error and perform no database writes.

UI and content:

- Morphic CMS changes can alter copy/artwork but cannot alter product IDs, prices used
  at checkout, export costs, or granted credits.
- All auth, credit, and checkout states are usable by keyboard and at mobile widths.
- Refreshing or closing the page during checkout/export recovers to a consistent state.

### 11.12 Required review decisions

Approve or change these before implementation:

- [ ] Per-stage image charging.
- [ ] Clipboard copy charging.
- [ ] Signed-in-only official exports and no anonymous export allowance.
- [ ] Five-minute window with one free protected retry.
- [ ] Thirty-minute reservation expiry and three-open-reservation limit.
- [ ] Non-expiring purchased and promotional credits.
- [ ] Refund shortfalls become credit debt and temporarily block exports.
- [ ] Polar embedded checkout rather than a full-page redirect.
