# Proton Storefront

<div align="center">
  A production e-commerce storefront for the Global market, built on top of the open-source
  <a href="https://github.com/saleor/storefront">Saleor Storefront</a> and extended heavily with our own features.
</div>
<br/>
> [!NOTE]
> **This project is a derivative work.** It started from the official [Saleor Next.js Storefront](https://github.com/saleor/storefront) starter (BSD-3-Clause) and has since diverged substantially: new pages, a redesigned UI, bilingual/RTL support, custom authentication flows, a reworked checkout, and integrations with our own backend services. It is **not** the official Saleor storefront and is **not affiliated with or endorsed by Saleor Commerce**. "Saleor" is a trademark of its owners.
 
## Built on Saleor
 
We use [Saleor](https://saleor.io) as the commerce backend (GraphQL API, catalog, checkout, orders, payments framework) and the Saleor storefront starter as our foundation. We keep the parts of the upstream stack that work well for us:
 
- Next.js App Router, React Server Components, TypeScript
- GraphQL Codegen with `TypedDocumentString`
- The checkout sub-app structure (`src/checkout/`), which we adapted rather than rewrote
Upstream links: [Saleor](https://github.com/saleor/saleor) · [Storefront](https://github.com/saleor/storefront) · [Docs](https://docs.saleor.io/docs/3.x)
 
## What we added or changed
 
**Internationalization & design**
- Full English + Arabic support (`next-intl`) with RTL-correct layouts (logical CSS properties only)
- Our own design-token system (CSS variables + Tailwind extension) with light/dark mode
- Redesigned header, footer, mega-menu, mobile navigation, and live search autocomplete
**Catalog & content**
- Country-of-origin filter and flag badges built on a Saleor attribute
- Wholesale and "Become a Supplier" pages (with Cloudflare Turnstile bot protection)
- CMS-driven About, privacy, terms, cookies, and refund pages
- Trending products section powered by our own analytics microservice
- Recently viewed products stored in user metadata
**Accounts & authentication**
- Custom split-screen login/register pages with a smart "email or phone" field
- Mandatory phone number collection via our own identity service
- Phone OTP login (feature-flagged)
- Account dashboard: orders, addresses, settings, data export, self-service account deletion
- Token refresh and session-expiry handling hardened for production behind a reverse proxy
**Checkout**
- Redesigned 3-step wizard (Contact → Shipping → Review & Pay) with RTL support
- Server-verified step gating and commit-on-advance, so entered data is reliably saved before payment
- Cash on Delivery (authorize-then-capture) and Stripe, via our own Saleor payment apps
- Delivery cutoff / estimated-delivery logic for the UAE
- GA4 e-commerce funnel tracking
- Order-created email notification webhook
## Tech stack
 
- Next.js 15 (App Router), React 19, TypeScript
- Tailwind CSS, framer-motion
- next-intl (`en`, `ar`)
- GraphQL via Saleor API + GraphQL Codegen
- pnpm
## Getting started
 
### 1. Prerequisites
 
A running Saleor 3.x backend (local Docker setup or hosted) and [pnpm](https://pnpm.io/installation).
 
### 2. Install
 
```bash
git clone <this-repository-url>
cd <repository-folder>
cp .env.example .env
pnpm i
```
 
Edit `.env` and set at least `NEXT_PUBLIC_SALEOR_API_URL` to your Saleor GraphQL endpoint (for example `http://localhost:8000/graphql/`). See `.env.example` for the other variables (analytics, identity service, mail, Turnstile, GA4, feature flags).
 
### 3. Run
 
```bash
pnpm dev
```
 
The app runs at `http://localhost:3000`.
 
### GraphQL
 
After changing queries or mutations, regenerate types:
 
```bash
pnpm run generate
```
 
### Quality checks
 
```bash
pnpm tsc --noEmit
pnpm lint
```
 
### Draft mode
 
Visit `http://{your-host}/api/draft` to disable caching and preview catalog and content changes instantly. See the [Next.js Draft Mode docs](https://nextjs.org/docs/app/building-your-application/configuring/draft-mode).
 
## Project structure (short)
 
- `src/app/` — App Router pages (`/[locale]/[channel]/...`) and API routes
- `src/ui/` — components, atoms, hooks, theme tokens
- `src/checkout/` — checkout sub-app (adapted from upstream)
- `src/graphql/` — our GraphQL documents; `src/gql/` is generated
- `src/lib/` — shared helpers (auth, identity, analytics, delivery, etc.)
## License and attribution
 
The upstream Saleor Storefront is released under the **BSD 3-Clause License**. This repository keeps the original copyright notice and license text (see [`LICENSE`](./LICENSE)) and adds our own modifications on top.
 
Parts of the code that originate from upstream remain © Saleor Commerce. Our additions are © their respective authors / Green Line Group, as stated in the license file.
