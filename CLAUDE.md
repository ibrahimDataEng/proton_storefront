# CLAUDE.md — Storefront Project Memory

## Stack

- Next.js 15.2.4 (App Router), React 19, TypeScript 5.3.3
- Tailwind 3.4.0 (extended with custom tokens), pnpm 9.6.0
- next-intl 4.3.9 (locales: en, ar — both primary)
- GraphQL via executeGraphQL (src/lib/graphql.ts) + codegen (src/gql/)
- IBM Plex Sans + IBM Plex Sans Arabic (next/font/google)

## Architecture

- Storefront: src/app/ (App Router, /[locale]/[channel]/...)
- Checkout sub-app: src/checkout/ — separate sub-app; see "Checkout Wizard (Session 24)" section for permitted changes
- Components: src/ui/components/ (NOT src/components/ — that doesn't exist)
- Atoms: src/ui/atoms/
- Theme tokens: src/ui/theme/tokens.ts
- GraphQL source: src/graphql/ (20 .graphql files)
- Generated types: src/gql/

## Hooks (Session 7)

Reusable client-side hooks — import from `@/ui/hooks/`:

- `useDebouncedValue` — `src/ui/hooks/useDebouncedValue.ts` — generic value
  debounce hook; default 300ms. Use for search inputs, form fields, etc.
- `useClickOutside` — `src/ui/hooks/useClickOutside.ts` — ref-based outside-click
  detection via mousedown+touchstart; accepts an `enabled` guard so the listener
  is only attached when the dropdown/panel is open.

## Critical aliases

- @/_ → ./src/_ (works)
- @ui/_ → ./src/ui/components/_ (fixed in Session 2)

## Design tokens (Session 2)

- CSS variables in: src/app/[locale]/globals.css
- Tailwind extended in: tailwind.config.ts
- TS constants in: src/ui/theme/tokens.ts
- Dark mode: data-theme="dark" on <html> element
- Colors: brand (primary/accent/muted), surface (base/raised/sunken),
  content (primary/secondary/inverse), line (subtle/default)

## Primitives built (Session 2)

- Container: src/ui/components/Container.tsx
- Button: src/ui/components/Button.tsx (primary/secondary/ghost × sm/md/lg)

## Homepage sections built (Session 3)

- HeroSection: src/ui/components/home/HeroSection.tsx
- FeaturedProductsSection: src/ui/components/home/FeaturedProductsSection.tsx
- CategoriesSection: src/ui/components/home/CategoriesSection.tsx (data from navbar menu)
- BrandStorySection: src/ui/components/home/BrandStorySection.tsx

## Known issues

- **Local dev-server flakiness (observed repeatedly, Session 35, env-level —
  not an app bug):** this project's `next dev` (Next.js 15.5.6) periodically
  falls into a documented dev-mode-only failure: the console/server log shows
  `src\app\not-found.tsx doesn't have a root layout` (Next error code `E394`),
  followed by `[Fast Refresh] performing full reload because your application
had an unrecoverable error` on a loop, and every route (including totally
  unrelated ones, and `/api/auth/refresh`) starts 500ing. It tends to show up
  after the dev server has been running a long time across several sessions
  and/or many rapid HMR recompiles, and `.next/cache/webpack/.../*.pack.gz`
  rename-ENOENT warnings are usually visible just before it hits. It is NOT
  caused by application code — confirmed by reproducing it on stock,
  untouched pages. **Fix**: stop the dev server, delete `.next` entirely, and
  restart (`pnpm dev`) — this has resolved it every time it's been hit
  (Sessions 34 and 35 both). If you're mid-debugging something and requests
  mysteriously stop reaching a page/action with no error, check server logs
  for `E394` / repeated "Fast Refresh...full reload" before assuming your own
  code is broken — it can silently swallow in-flight client effects/requests
  without any error surfacing at the call site.
- ~~`/login` and `/register` 500 for every visitor~~ — fixed on
  `hotfix/login-register-rsc-crash` (merged directly to main per the hotfix
  convention). Root cause: both standalone pages are Server Components that
  passed an inline `onModeChange={() => undefined}` function prop to
  `AuthFormWrapper` (a Client Component) — invalid under Next.js 15's RSC
  model. Fix: `AuthFormWrapper`'s `onModeChange` prop is now optional with
  an internal `() => {}` default; both pages simply omit the prop.
  `AuthModal.tsx`'s own usage (passing `setAuthModalMode` client-to-client)
  was untouched — it was never the problem. Verified live in both en/ar with
  a fully cleared `.next` cache: both pages render with zero console/server
  errors. Closed beads front_store-gfa. Note for whoever's testing standalone
  auth pages next: the Sign In / Create Account tab buttons on these two
  pages don't actually switch the visible form — that's pre-existing and
  unrelated to this fix (`AuthFormWrapper`'s `effectiveView` is derived from
  the `mode` prop, which is a fixed per-page value on these two routes, not
  from the tab click's internal state — only `AuthModal`'s usage, where
  `mode` is real state, makes the tabs functional).
- 7 lint warnings: 6 in src/checkout/ + 1 in Logo.tsx
  (next/image suggestion — Logo is raw <img>)
- ~~/pages/about may not exist in Saleor backend~~ — confirmed working in
  Session 31 (navigated + rendered live); backed by a real Saleor Page record
  (slug "about") via PageGetBySlugDocument, with special parsing
  (parseAboutContent.ts → AboutPageClient) for its 4-header-section content
- MobileDrawer.tsx / MobileNavClient.tsx / MobileDrawerWrapper.tsx /
  MobileMenu.tsx / useMobileMenu.ts are confirmed dead code (not imported by
  any live route) — flagged in Session 30/31, cleanup deferred to a future
  session (beads: see "cleanup: remove dead MobileDrawer/MobileMenu" issue)
- Bidi (Unicode bidirectional text) pattern (Session 32): any digit-containing
  or otherwise LTR-by-nature value rendered inside Arabic-context (RTL) markup
  must be wrapped in `dir="ltr"` to avoid bidi reordering — see
  ContactPageClient.tsx's phone number ContactCard for the pattern (a
  `valueDir?: "ltr"` prop passed only on the phone card). Not every
  LTR/mixed-content string needs this: verify with the browser first — e.g.
  a single unbroken run (an email address) or digits individually anchored
  between strong-Arabic words (the Hours value, "9:00 صباحاً") already
  bidi-resolve correctly and don't need it; only isolated multi-token
  runs (a phone number's space-separated groups) get reordered. Separately,
  `dir="auto"` on an empty `<input>`/`<textarea>` resolves to computed
  `direction:ltr` (not `rtl`, even inside an RTL document) since browsers
  evaluate the field's VALUE, not its `placeholder` — this detaches trailing
  neutral punctuation (e.g. "…") from an Arabic placeholder. Fix: force
  `dir="rtl"` conditionally on locale (`locale === "ar" ? "rtl" : "auto"`)
  only on fields actually confirmed affected (test empirically — an Arabic
  "؟" question mark does NOT exhibit this, only certain neutral characters
  like "…" do); don't blanket-apply to every field.
- Pre-existing hydration-mismatch console warning (found during Session 32,
  not fixed, out of scope): Footer.tsx's Mastercard SVG `<circle>`/`<path>`
  elements get a client-only `style={{transition-behavior:...}}` injected
  that the server-rendered HTML doesn't have — likely a global CSS
  transition rule unintentionally matching footer SVG children. Cosmetic
  only (no visible symptom found), but worth root-causing in a future
  session.
- Order detail page not built (accordion in account/OrdersSection covers basic needs)
- Quantity stepper: CheckoutLinesUpdate added in session 14 via codegen
- "Add to cart" on recommendations navigates to product page —
  defaultVariant.id is not in ProductListItem fragment
- Variants data: UI ready but variants not yet configured in Saleor backend
- CountrySection requires "Origin of Country" attribute (slug: origin-of-country)
  assigned to products in Saleor Dashboard for ?country= filter to return results
- BrandStorySection background from Unsplash CDN — replace with own photo when available

## Components redesigned

- Header: HeaderWrapper (client) + Header (server),
  hide-on-scroll past 80px, reappears on scroll-up,
  fixed positioning, surface-base/80 backdrop-blur
- Footer: redesigned with 4-col grid (Brand / Explore / Legal / Social),
  brand-primary dark bg, social via Lucide icons, tokens applied,
  CMS menu logic + ChannelSelect + Skeleton preserved
- Nav: NavLink uses brand-primary (active) / content-secondary (default),
  console.log + revalidate:1 fixed in NavLinks.tsx
- NavLinks (Session 23, corrected Session 31): replaced CMS-driven items with
  fixed items: Home → /, Shop → MegaMenu + /products, Wholesale →
  /pages/wholesale, Contact → /pages/contact-us; fetches CategoriesWithChildren
  (not navbar menu). Desktop-only — never rendered on mobile (no `mobile` prop
  exists on ShopNavItem; that Session-23 note was stale). "Become a Supplier"
  removed from here in Session 31 (still in Footer's Legal column); mobile
  reaches it via the new MobileLinksMenu popup instead.
- HeaderWrapper (Session 23): top now reads var(--topbar-height, 0px) instead
  of fixed top-0; TopBar sets that variable client-side
- SearchBar (Session 7): live autocomplete dropdown with 300ms debounce,
  request-id race-condition guard, full token theming, ARIA combobox attrs,
  keyboard nav (ArrowDown/Up/Enter/Escape/Tab), spinner, skeleton rows,
  "See all results" row. Mobile: icon trigger → full-screen overlay
  (role=dialog, focus trap, body scroll lock). New files:
  SearchDropdown.tsx, SearchOverlay.tsx, MobileSearchTrigger.tsx.
  Hooks: useDebouncedValue, useClickOutside.
- CartLineItem (Session 14): "use client", animated save-for-later (300ms
  exit), quantity stepper with optimistic UI + 400ms debounce,
  DeleteLineButton, SaveForLaterButton
- OrderSummary (Session 14): sticky on desktop, free-shipping progress bar,
  promo code field (disabled/coming-soon state), CheckoutLink
- CartRecommendations (Session 14): async server component, round-robin
  interleave by category, Suspense + skeleton, falls back to navbar menu
- SavedForLater (Session 14): localStorage, dedup by variantId,
  custom event sync across tabs, fade-in reveal, move-to-cart action
- FilterBar (Session 15): sort + category + price range + in-stock toggle;
  four custom dropdowns; URL-param driven (pushes to router); active-filter
  dot indicators; mobile bottom-sheet drawer (role=dialog, max-h-85vh);
  useClickOutside hook; clear-all button — confirmed in Session 33 diagnostic
  that mobile is already a compact single row (count + "Filters" button,
  ~64px) that only opens the bottom-sheet on demand; NOT a persistent tall
  bar, no change was needed here
- CategorySidebar (Session 33): mobile-only fixed icon rail (`fixed right-0
... w-16`) removed entirely — it was reserving 64px of mobile viewport
  width via a `mr-16` margin on products/page.tsx's content section, which
  was the real cause of cramped 2-col product cards on mobile (not the
  column count, which was already correct). CategorySidebar.tsx now
  renders desktop-only (`hidden ... md:block` sticky left sidebar, `<md`
  literally renders nothing) — desktop behavior/markup unchanged. Mobile
  category nav is now `CategoryChips.tsx` (new file, "use client",
  `md:hidden`) — a horizontal `overflow-x-auto` scrollable chip row
  (scrollbar hidden via `[scrollbar-width:none]` +
  `[&::-webkit-scrollbar]:hidden`) rendered above the product grid in
  products/page.tsx, one pill per root category (`bg-brand-primary
text-content-inverse` when active, same convention as FilterBar's
  filled-pill active state), links to `/categories/{slug}` (same target as
  the old rail — not `/products?category=`). Data-driven via a new
  `CategoryChipsWrapper.tsx` (Server Component) fetching the same
  `CategoriesWithChildrenDocument` query CategorySidebarWrapper already
  used — no hardcoded categories. RTL verified live (Arabic /ar/): the
  chip row and its overflow-scroll direction correctly follow `dir="rtl"`
  from the document with zero manual reversal needed — did not assume,
  confirmed with a real screenshot per Session 27's RTL-bug history.
  products/page.tsx content section padding changed from flat `p-8` to
  `px-4 py-6 md:p-8` to reclaim further mobile width alongside the rail
  removal.
- ProductElement (Sessions 15-16, height fix Session 33): "use client",
  selectedVariantId state (first variant pre-selected), interactive pills
  with whileTap, whileInView entrance animation, exact per-variant price,
  struck-through undiscounted price when discounted, OOS badge; 4-col grid
  (2/3/4 mobile/tablet/desktop). Session 33: the `<li>` is a direct CSS
  Grid item, so Grid's default `align-items: stretch` stretched the `<li>`
  to full row height, but the inner `<div className="flex flex-col ...">`
  had no `h-full` and never actually filled that stretched height — content
  just top-aligned, leaving dead space below on shorter cards. Combined
  with no `mt-auto` on the price/button block, two cards in the same row
  with different product-name wrap-line counts (1 line vs 2) showed their
  "Add to Cart" buttons at different vertical positions. Fixed by adding
  `h-full` to the inner wrapper and moving price + ProductAddButton into a
  `mt-auto` sub-container so they always pin to the card's bottom
  regardless of name length — verified against real catalog data
  ("Syrian Watermelon Seeds" vs "Special Mix Nuts", and the original
  "خلطة مكسرات سبيشل" vs "بزر بطيخ سوري" pair, both /en/ and /ar/, both
  buttons landing at the same y-position in each case. **Standard pattern
  for any future card component with variable-length content**: give the
  grid-item's content wrapper `h-full`, and wrap whatever should stay
  bottom-pinned (price, CTA, meta row) in an `mt-auto` container — CSS
  Grid's row-stretch alone does not propagate down through a non-`h-full`
  child.
- ProductAddButton (Sessions 15-16): select→add flow; "Select Option" outline
  button scrolls to pills; AnimatePresence icon/text swap; shake on error;
  success green for 2s then reset
- EmptyState (Session 16): reusable — icon (floating loop), title + subtitle
  (fade+slide), optional action (delayed fade); used by cart, search,
  categories
- not-found pages (Session 17): root (bilingual CSS-only), locale (bilingual
  CSS-only + Link), (main) (compass SVG + framer motion + i18n), products/[slug]
  (broken-box SVG migrated to i18n)
- error pages (Session 17): global-error (HTML/body, X-in-circle CSS anim,
  bilingual), (main)/error (warning triangle + framer motion + i18n + digest)
- PDP components (Session 18): src/ui/components/pdp/
  - ProductGallery — multi-image gallery, thumbnail row (6 max), framer AnimatePresence
    fade on main image change, lightbox (fixed overlay, Escape to close, click-outside)
  - ProductVariantSelector — client-side pill selector, OOS greyed+strikethrough,
    low-stock warning ("only N left"), whileTap animation
  - ProductInfo — full right-column orchestrator: breadcrumb, h1, price+undiscounted,
    variant selector, quantity stepper (1–min(99,qty)), AvailabilityMessage,
    add-to-cart (idle/pending/success/error + shake), attributes table, collapsible description
  - RelatedProducts — async server component, Suspense skeleton, same-category,
    filters current slug, 4-col grid desktop / 2-col mobile
- PromoCodeField (Session 20): fully wired — checkoutAddPromoCode + Remove mutations,
  AnimatePresence applied/input states, 4s error auto-clear timer, discount amount display
- CountrySection (Session 21): "use client" drag-to-scroll carousel, 11 countries,
  flagcdn.com flag images (80×54, code field), edge gradient fades, links to
  /products?country={slug}; exports COUNTRIES array (used by FilterBar pill)
- BrandStorySection (Session 21): Unsplash nuts background (next/image fill + priority),
  black/60 overlay, all text → text-white/text-white/80, white outline CTA button,
  relative/z-10 content structure
- FilterBar (Session 21): activeCountry prop + dismissible country pill above filter row
  (desktop + mobile sheet); hasActiveFilters includes activeCountry; clear-all works
- TopBar (Session 23): src/ui/components/nav/TopBar.tsx — "use client"; fixed top-0
  z-[51]; visible on /, /products, /pages/wholesale only (isTopBarPath util);
  sets --topbar-height CSS variable (0px or 36px) used by HeaderWrapper + layout;
  left: 🚚 free-shipping static text; right: rotating ticker (4 messages, 4s
  interval, AnimatePresence fade); full i18n via "topbar" namespace
- ShopNavItem / MegaMenu (Session 23, corrected Session 31): src/ui/components/
  nav/ShopNavItem.tsx — "use client"; desktop-only hover panel (fixed
  full-width, left category column + right subcategory grid 3-4 cols, scaleY
  animation), hidden on mobile via `md:` classes — no `mobile` mode/prop
  exists (the MobileMenu accordion mode described here in Session 23 was never
  actually wired up — see MobileLinksMenu (Session 31) below for what mobile
  actually uses); RTL-aware chevrons + arrow directions; useClickOutside for
  desktop close-on-outside-click; categories fetched via CategoriesWithChildren
  GraphQL query (level=0, 8 root cats, 10 children each); rendered by NavLinks
  server component
- MobileLinksMenu (Session 31): src/ui/components/nav/components/
  MobileLinksMenu.tsx — "use client"; small popup (NOT the category mega
  menu — separate concern) triggered by a new h-9 w-9 hamburger icon button
  inserted into Header.tsx's mobile row (md:hidden), after LanguageSwitcher;
  lists the 4 static pages unreachable from BottomNavClient: Wholesale,
  Become a Supplier, Contact Us, About (/pages/about — confirmed working,
  backed by a real Saleor Page record, not a stub); local useState +
  useClickOutside + framer-motion AnimatePresence (ShopNavItem's pattern, not
  headlessui); closes on outside click, Escape (document-level listener while
  open — a button-only keydown handler is NOT enough, since focus can be on a
  link inside the popup), and link click; positioned via logical `end-0` +
  `max-w-[calc(100vw-1.5rem)]` so it never clips off either edge in RTL or
  LTR without special-casing direction. Labels via new "nav" namespace keys:
  supplier, about, openMenu (all bilingual, Arabic reuses Footer's exact
  "كن مورّداً لنا" string for consistency).
  Fixed in the same session: Header.tsx's mobile row was missing `min-w-0` on
  the search bar's flex-1 wrapper — without it the row silently overflowed
  the viewport (clipped by `overflow-x: hidden` on body, no visible
  scrollbar) once a 4th item was added, because a flex item's default
  min-width:auto blocks shrinking below its content's intrinsic width even
  with `truncate` on a descendant. Add `min-w-0` to any flex-1 wrapper in this
  row if it grows further.
- ContactPageClient (Session 22, bidi fixes Session 32): src/ui/components/contact/
  ContactPageClient.tsx — "use client"; two-column layout (info cards + form); 4 info
  cards (email/phone/address/hours) with spring lift + brand-primary accent bar on
  hover; form (name/email/subject/message) with inline validation; submit
  AnimatePresence: idle→sending→sent (green) auto-reset 5s; useInView scroll-triggered
  stagger; full RTL (dir="auto", mirrored accent bar); rendered via pages/[slug]/page.tsx
  when slug === "contact-us" (NOT a standalone route). Session 32: ContactCard gained a
  `valueDir?: "ltr"` prop (applied only to the phone card) to fix the phone number
  rendering reversed in Arabic; Message textarea's `dir` changed from unconditional
  `"auto"` to `locale === "ar" ? "rtl" : "auto"` to fix its Arabic placeholder's
  trailing "…" rendering on the wrong side — see "Bidi ... pattern (Session 32)" under
  Known issues for the general rule and why Subject/Name were left unchanged.

## Pages completed

- / (home) — 4 sections (sessions 2/3)
- /categories — index page built (session 13)
- /categories/[slug] — 404 bug fixed, empty state animated (session 13/16)
- /search — theme applied (session 6), no-results EmptyState (session 16)
- /pages/[slug] — CMS page, design tokens applied (session 11)
- /collections/[slug] — design tokens applied (session 11)
- /login — fallback standalone page (session 8) — currently 500s, see "Known issues"
- /register — fallback standalone page (session 8) — currently 500s, see "Known issues"
- /reset-password — set password from email token (session 10); redirectUrl
  fix (session 36, see "Account Confirmation & Password Reset Redirect Fix")
- /confirm-account — account activation from registration email (session 36) —
  see "Account Confirmation & Password Reset Redirect Fix" section
- /delete-account — reads `?token=`, calls `confirmAccountDeletion`; 4 states
  (missing token / not authenticated / expired-invalid / success →
  auto-logout + redirect home after 2s) (session 34)
- /[any-bad-url] — 404/error coverage complete: root (bilingual CSS-only), locale, (main) framer motion, products/[slug] (session 17)
- /account — full SPA dashboard (session 19):
  - AccountDashboard: client SPA, 5 sections (overview/orders/recentlyViewed/addresses/settings) — recentlyViewed added session 35
  - AccountSidebar: desktop sidebar + mobile horizontal tab bar, sign-out via useAuth
  - OverviewSection: 4 stat cards (total orders, last order, default address, member since), staggered framer entrance
  - OrdersSection: paginated (5+5), accordion line items, status badge color-coding, product thumbnails
  - RecentlyViewedSection: reuses ProductElement in the same grid as RelatedProducts; EmptyState when
    empty; products resolved server-side in account/page.tsx (session 35 — see "Recently Viewed
    Products" section below)
  - AddressSection: CRUD grid (2-col), inline AnimatePresence slide form, inline delete confirm, set-default actions
  - SettingsSection: edit name (updateAccount action) + reuse ChangePasswordForm
  - account/actions.ts: updateAccount, createAddress, updateAddress, deleteAddress, setDefaultAddress,
    recordProductView, getRecentlyViewed (latter two added session 35)
  - New GraphQL mutations: AccountUpdate, AccountAddressCreate, AccountAddressUpdate, AccountAddressDelete,
    AccountSetDefaultAddress, UpdateUserMetadata (session 35)
  - UserDetailsFragment extended: dateJoined + addresses array + metadata (session 35)
  - OrderDetailsFragment extended: status (OrderStatus)
- /cart — full redesign, two-column layout, recommendations,
  saved for later, quantity stepper, order summary (session 14)
- /products — filters + variant display + 4-col grid (sessions 15/16);
  country attribute filter via ?country= URL param (session 21)
- /products/[slug] — full PDP redesign (session 18):
  - ProductGallery: multi-image, thumbnail row, lightbox (framer fade + scale)
  - ProductVariantSelector: client-side pills, OOS greyed+strikethrough, low-stock warning
  - ProductInfo: breadcrumb, price+undiscounted, quantity stepper, add-to-cart
    (AnimatePresence states: idle/pending/success/error + shake), attributes table,
    collapsible description; fire-and-forget `recordProductView(product.slug)`
    call in a `useEffect` (guarded by `useAuth().isLoggedIn` — guests aren't
    tracked), session 35
  - RelatedProducts: async server component, same-category, 4-col grid, Suspense skeleton
- /pages/wholesale — full Wholesale page (session 22):
  - WholesalePageClient: src/ui/components/wholesale/WholesalePageClient.tsx ("use client") — 9 sections
  - Hero: brand-primary bg + radial gradient, word-by-word headline stagger, animated count-up stats
    (4 counters with cubic ease-out), two CTAs: WhatsApp + LinkWithChannel Browse Products
  - Supply: 8 product cards (🥜🌰🫘🌰🍇🌿☕🧆), horizontal scroll on mobile / 4-col grid desktop,
    "Bulk Available" badge, emoji placeholders (TODO: replace with real product images)
  - Targets: 2×2 grid, spring-lift hover, start-aligned accent bar
  - Benefits: zigzag 3-row layout, BenefitRow sub-component, alternates slide-left/right;
    gradient placeholder blocks (TODO: replace with real photos)
  - Steps: horizontal timeline (desktop) / vertical stepper (mobile), sequential stagger
  - Certificates: 3-slot dashed-border placeholder section (TODO: ISO, Halal, etc.)
  - Testimonials: 3-slot skeleton placeholder section (TODO: real client reviews)
  - FAQ: 5-item accordion, AnimatePresence height transition, + rotates to ×
  - CTA: brand-primary bg, WhatsApp (#25D366) pulse-glow button, locale-aware wa.me message
  - i18n: "wholesale" namespace in en.json + ar.json; all text via useTranslations, zero hardcoded strings
  - RTL: word-stagger works in both directions, zigzag CSS-grid reversal works naturally
- /pages/become-supplier — full Become a Supplier page (session 26):
  - SupplierPageClient: src/ui/components/supplier/SupplierPageClient.tsx — Server Component
    orchestrator (deliberately NOT "use client" — it composes async Server Component sections
    directly; a Client Component parent cannot import/render `next-intl/server`-based async
    Server Components, so the orchestrator must stay server-side)
  - SupplierHero, SupplierCategoriesSection, SupplierRequirementsSection, SupplierStepsSection,
    SupplierCtaSection: all Server Components (async, `getTranslations`/`getLocale` from
    "next-intl/server"), no framer-motion — static Tailwind-only styling per the
    "Server Components by default" rule
  - SupplierApplicationForm ("use client"): full application form — company/country/contact/
    website/email/phone(+country-code select incl. "other" free text)/business-type/category
    (multi-select chips, min 1)/products/nature-of-business (2000-char hard limit + live counter)/
    certifications (checkboxes)/file upload/Turnstile/terms; on-blur validation with re-validation
    of untouched fields on submit; submit state machine (idle→sending→sent/error, AnimatePresence)
    mirrors ContactPageClient's pattern; honeypot field "website_url_2" (visually hidden, not
    type="hidden", so bot autofill still catches it); "Country of Operation" select reuses the
    exported `COUNTRIES` array from `@/ui/components/home/CountrySection`
  - SupplierFileUpload ("use client"): drag-and-drop + click-to-browse, single file, accepts
    pdf/doc/docx/xls/xlsx/zip/jpg/jpeg/png, 10MB client-side cap (mirrors server-side cap) —
    bad selections are rejected inline and never reach `onChange`
  - SupplierFaqSection ("use client"): 4-item accordion, same AnimatePresence height-transition
    pattern as WholesalePageClient's FaqSection
  - TurnstileWidget (src/ui/components/supplier/TurnstileWidget.tsx, "use client"): reusable
    Cloudflare Turnstile wrapper — loads challenges.cloudflare.com/turnstile/v0/api.js via a
    plain `<script>` tag in useEffect (no npm dependency), renders into a ref'd div, exposes
    `onVerify(token)` / `onExpire()` props; reads site key from
    `NEXT_PUBLIC_TURNSTILE_SITE_KEY`. Reuse this component for any future form that needs
    bot protection — don't reimplement the script-loading dance.
  - src/app/api/supplier/route.ts: parses `request.formData()` (multipart, NOT JSON like
    /api/contact); validates all required fields server-side; honeypot check (silent fake
    success if "website_url_2" is filled); verifies the Turnstile token server-side via POST to
    challenges.cloudflare.com/turnstile/v0/siteverify using `TURNSTILE_SECRET_KEY`; attaches the
    uploaded file directly to the outgoing nodemailer email (buffer from FormData) with NO disk/
    persistent storage; same nodemailer transport env vars as /api/contact
    (SMTP_HOST/PORT/SECURE/USER/PASS); from "Tawasi Plus Suppliers", to CONTACT_TO_EMAIL; error
    codes: MISSING_FIELDS, INVALID_EMAIL, INVALID_URL, FILE_TOO_LARGE, INVALID_FILE_TYPE,
    TURNSTILE_FAILED, SEND_FAILED
  - "become-supplier" slug special-cased in pages/[slug]/page.tsx (generateMetadata + default
    export), before the Saleor fetch — identical pattern to contact-us/wholesale; no Saleor
    Page record needed
  - Nav link added in NavLinks.tsx (between Wholesale and Contact); static link added to
    Footer.tsx's `legalLinks` array (not the CMS-driven Explore column)
  - i18n: "supplier" namespace in en.json + ar.json (meta/hero/categories/requirements/steps/
    form/faq/cta) — Arabic copy is formal Modern Standard Arabic (الفصحى) throughout, not
    dialect
  - RTL phone/select fixes (session 29): two real bugs only showed up on manual visual
    review in Arabic, not from HTML-string inspection — use logical Tailwind properties
    (ps-_/pe-_/ms-_/me-_/start-_/end-_, gap-_ on flex containers), not physical ones
    (pl-_/pr-_/ml-_/mr-_/left-_/right-_), in any future form work in this codebase:
    (1) a shared `inputClass()` helper baked in `w-full`, then a caller appended a
    separate `w-28`/`w-24` alongside it — both are width utilities with equal
    specificity, so the winner depends on Tailwind's internal generation order, not on
    which class is listed first/last in JSX. This stretched the phone row's country-code
    select to full width and pushed the phone number input out of the form. Fixed by
    splitting into a width-free `inputBaseClass()` + per-field width (w-full px-4 for
    normal fields; w-28 shrink-0 / w-24 shrink-0 / min-w-0 flex-1 for the phone row) —
    never combine two width utilities on one element, even via a shared base + override.
    (2) `@tailwindcss/forms` draws every `<select>`'s dropdown chevron with a hardcoded
    `background-position: right ...`, which is a physical value that never flips for
    RTL — in Arabic the chevron and the select's own (right-aligned) text land on the
    same side and overlap. Fixed with `rtl:bg-[left_...]`overriding the default`bg-[right_...]`, plus `ps-_/pe-_`(not`px-\_`) so the chevron always has clearance
    on whichever side it lands

## Health status (post-Session 25)

- TS errors: 0 (verified via `pnpm tsc --noEmit`)
- Lint warnings: 7 (baseline — 6 in src/checkout/ + 1 Logo.tsx warning restored)
- Brand-primary updated: #2D3B2E → #2D6A4F (richer, more vibrant green); dark mode #4A5D4A → #4D8C6B
- Checkout brand applied: all checkout primitives now use #2d6a4f (Button, inputs, SelectBox, icons, AppConfigProvider)
- Working tree: clean on feature/ui-redesign-session-25
- framer-motion@12.38.0 added as dependency (session 16)
- .eslintrc.json override updated: global-error.tsx now in no-default-export exclusion list
- console.log("jjj", locale) removed from products/[slug]/page.tsx (session 18)
- CheckoutAddLineWithQuantity mutation added: src/graphql/mutations/CheckoutAddLineWithQuantity.graphql
- addLineWithQuantity server action added to cart/actions.ts (session 18)
- Account server actions: src/app/[locale]/[channel]/(main)/account/actions.ts (session 19)
- 5 new GraphQL mutations in src/graphql/mutations/Account\*.graphql (session 19)
- CheckoutAddPromoCode + CheckoutRemovePromoCode mutations added (session 20)
- applyPromoCode + removePromoCode server actions added to cart/actions.ts (session 20)
- CountrySection + BrandStorySection added to homepage (session 21)
- country filter (origin-of-country attribute) wired to /products (session 21)
- WholesalePageClient rebuilt (session 22 XL): 9 sections, brand-primary #2D6A4F, word-stagger hero,
  supply cards, 3 placeholder sections (benefits photos, certificates, testimonials)
- brand-primary color: #2D3B2E → #2D6A4F in globals.css + tokens.ts (session 22)
- TopBar added above HeaderWrapper in (main)/layout.tsx (session 23); CSS var
  --topbar-height drives layout offset; no hard-coded padding
- CategoriesWithChildren.graphql added + codegen run (session 23); fetches
  level=0 categories + 10 children each for mega menu
- Nav items replaced: Home / Shop (mega menu) / Wholesale / Contact (session 23)
- topbar + nav i18n namespaces added to en.json + ar.json (session 23)
- Checkout wizard built (session 24): 3-step Contact→Shipping→Payment with AnimatePresence transitions, CheckoutStepper, brand theming, trust bar, WhatsApp button
- CheckoutErrorBanner added (session 25): toast.onChange interception, inline red alert with dismiss + WhatsApp help
- ToastContainer moved to bottom-center (session 25)
- HTML5 native form validation on wizard step advance (session 25)
- CheckoutDiscovery hidden (session 25); checkout page wrapped in card; logo uses Image directly

## Button-as-link pattern (important)

Button renders <button> — wrapping in LinkWithChannel creates invalid HTML.
Use LinkWithChannel with className directly for link-styled buttons.

## getSaleorLanguage helper

Single source of truth: src/lib/saleor-language.ts
Imported by Footer, NavLinks, FeaturedProductsSection, CategoriesSection,
collections/[slug]/page.tsx, search/page.tsx, pages/[slug]/page.tsx,
SearchBar.tsx, SearchOverlay.tsx (session 7).

## i18n namespace layout

- `header` — (now empty; searchForProducts key removed in session 7)
- `Search` — placeholder, searching, noResults, seeAll, openSearch, closeSearch
- `footer` — copyright, companyName, poweredBy, changeCurrency, loadingError
- `availability` — outofstock
- `categories` — allCategories, noProducts, backToHome
- `cart` — title, emptyTitle, emptySubtitle, exploreProducts, qty, remove,
  removing, saveForLater, savedForLater, moveToCart, subtotal, shipping,
  shippingFree, shippingCalculated, grandTotal, freeShippingProgress,
  freeShippingUnlocked, promoCode, promoApply, proceedToCheckout,
  youMightAlsoLike, taxIncluded, alreadySaved, addToCart, added,
  quantityUpdate, increase, decrease,
  promoApplied, promoInvalid, promoNotApplicable, promoRemove, discount (session 20)
- `products` — title, count, addToCart, selectVariant, outOfStock, filters,
  sortBy, newest, priceLowHigh, priceHighLow, bestSelling, biggestDiscount,
  allCategories, priceRange, minPrice, maxPrice, apply, inStockOnly,
  clearFilters, noResults, clearAndReset, added,
  selectSize, relatedProducts, addError, readMore, readLess,
  specifications, onlyLeft, quantity (session 18),
  filteredByCountry, clearCountry (session 21),
  countryOfOrigin, origin (session 37 — origin interpolates {country},
  reused for both the PDP gallery badge and the PLP filter dropdown)
- `auth` — login, register, logout, email, password, confirmPassword, firstName,
  lastName, forgotPassword, sendResetLink, resetEmailSent, switchToRegister,
  switchToLogin, confirmEmailRequired, backToLogin, resetPassword, newPassword,
  setPassword, passwordUpdated, invalidResetLink, expiredResetLink,
  requestNewLink, account, accountInfo, changePassword, currentPassword,
  confirmNewPassword, passwordChanged, signOut, myAccount, errors.\*
- `account` — overview, orders, addresses, settings, noOrders, noOrdersSubtitle,
  shopNow, viewDetails, loadMore, addAddress, editAddress, deleteAddress,
  confirmDelete, setDefaultShipping, setDefaultBilling, defaultShipping,
  defaultBilling, personalInfo, security, saveChanges, saved, memberSince,
  totalOrders, lastOrder, defaultAddress, noAddress, addressSaved, addressDeleted,
  cancel, confirm, firstName, lastName, streetAddress1, streetAddress2, city,
  postalCode, phone, qty (session 19)
- `recentlyViewed` — navLabel, emptyTitle, emptySubtitle (session 35 — CTA in the
  empty state reuses `account.shopNow` rather than duplicating it)
- `confirmAccount` — pageTitle, pending, successTitle, successSubtitle,
  errorTitle, errorSubtitle, loginButton (session 36)
- `notFound` — title, subtitle, goHome, browse, checkUrl (session 17)
- `home` — header, description, aboutLink, contactLink,
  shopByCountry (session 21), trendingNow (session 44)
- `topbar` — freeShipping, invoices, wholesale, countries, quality (session 23)
- `nav` — home, shop, wholesale, contact, viewAll, allCategories (session 23);
  +supplier, about, openMenu (session 31 — used by MobileLinksMenu popup)
- `checkout` — securePay, freeReturns, fastDelivery (session 24 — used by CheckoutTrustBar)
- `supplier` — meta.{title,description}; hero.{eyebrow,headline,subtitle,ctaApply,ctaWhatsApp,
  stat1-3Value,stat1-3Label}; categories.{sectionTitle,sectionSubtitle,nuts,driedFruits,seeds,
  coffee,snacks,spices,staples,herbs}; requirements.{sectionTitle,sectionSubtitle,card1-4Title,
  card1-4Subtitle}; steps.{sectionTitle,step1-4Title,step1-4Subtitle}; form.{sectionTitle,
  sectionSubtitle,companyNameLabel/Placeholder,countryLabel/Placeholder,contactNameLabel/
  Placeholder,websiteLabel/Placeholder,emailLabel/Placeholder,phoneLabel,phoneCodeLabel,
  phoneNumberPlaceholder,phoneCodeOther,phoneCodeOtherPlaceholder,businessTypeLabel/Placeholder,
  businessType{Manufacturer,Farmer,Distributor,Importer,Broker},categoryLabel,categoryHelp,
  productLabel/Placeholder,natureLabel/Placeholder,natureCounter,certificationsLabel,
  cert{Iso,Haccp,Halal,Other},uploadLabel,uploadHint,uploadDragText,uploadOr,uploadBrowseText,
  uploadRemove,uploadErrorType,uploadErrorSize,termsLabel,turnstileError,submit,sending,sent,
  sentSubtitle,sendError,required,invalidEmail,invalidUrl,invalidPhone,selectAtLeastOne};
  faq.{sectionTitle,q1-4,a1-4}; cta.{headline,subtitle,button,hours,waMessageEn,waMessageAr}
  (session 26 — Arabic copy is formal MSA throughout, not dialect)
- `accountDeletion` — sectionTitle,sectionSubtitle,deleteButton,modalTitle,
  whatGetsDeletedTitle,whatGetsDeletedItem1-3,whatIsKeptTitle,whatIsKeptBody
  (the explicit PII-retention disclosure — states past orders keep their name/
  address/phone unanonymized; do not soften this copy),confirmInstruction,
  confirmPlaceholder,confirmButton,requestSuccessTitle,requestSuccessBody
  (interpolates `{email}`),closeButton,pageTitle,processing,successTitle,
  successBody,missingToken,invalidOrExpired,notAuthenticated,backHome
  (session 34 — formal MSA Arabic; the confirm word "DELETE" itself stays
  literal/untranslated in both locales per the type-to-confirm requirement)
- `error`, `button`, `welcome`, `goodbye` — misc
  (`error` extended in session 17: +title, +description, +tryAgain, +goHome, +code)

## Search URL param

The search page uses `?query=` (NOT `?q=`). All new code that constructs
search URLs must use `query` as the param name.

## Auth system

- Cookie names: `saleor_token` (access), `saleor_refresh_token` — httpOnly, SameSite=Lax
- Lib: `src/lib/auth/` — types.ts, jwt.ts, cookies.ts
- Route Handlers: `src/app/api/auth/` — login, register, logout, refresh, forgot-password
  (all make direct fetch() to Saleor GraphQL; never expose raw error codes)
- AuthContext: `src/ui/context/AuthContext.tsx` — provides user, isLoggedIn,
  openAuthModal/closeAuthModal, logout(); accepts initialUser from SSR for no flash
- useAuth(): exported from AuthContext.tsx — throws outside AuthProvider

### Auth UI components (`src/ui/components/auth/`)

- AuthFormField — labeled input, dir=auto for RTL, design tokens, error state
- AuthFormWrapper — tab switcher (Login/Register), view state machine
  (login | register | forgot | confirmation)
- LoginForm — email+password → POST /api/auth/login
- RegisterForm — optional firstName/lastName + email + password + confirm
- ForgotPasswordForm — email only → always shows success (no email enumeration)
- AuthModal — role=dialog, focus trap, Escape/backdrop-click, body scroll lock

### Auth pages

- /login → `src/app/[locale]/[channel]/login/page.tsx` (redirects to / if logged in)
- /register → `src/app/[locale]/[channel]/register/page.tsx` (same guard)

### Middleware

Token refresh is handled in `src/middleware.ts`:
runs next-intl first, then silently refreshes expiring tokens (<5 min) via
/api/auth/refresh before forwarding the response.

### Wiring

- `[channel]/layout.tsx` reads saleor_token cookie, decodes JWT, seeds AuthProvider
- AuthModal rendered once in layout (always mounted, portal-free)
- UserMenuContainer simplified to just render UserMenu (no more GraphQL fetch)
- UserMenu now a client component using useAuth() — shows login button or
  user name + logout dropdown
- account/actions.ts — updateAccount, createAddress/Update/Delete,
  setDefaultAddress: all read saleor_token cookie → Authorization: Bearer header

## Account Deletion (Session 34)

Built on a diagnostic session against local Saleor 3.23.1 that confirmed:
`accountRequestDeletion(redirectUrl!, channel)` and `accountDelete(token!)`
both require `AUTHENTICATED_USER` (self-service only, no admin override);
`redirectUrl` **is** validated against `ALLOWED_CLIENT_HOSTS` (an external
URL is rejected with a clear error — no open-redirect risk); and — the
load-bearing finding — after `accountDelete` the `account_user` row is
**hard-deleted**, but any past order **survives** with `user_id` set to
`NULL` while `order_order.user_email` and the linked billing/shipping
`account_address` rows (name, phone, street address) are left **completely
untouched**. Saleor does not anonymize PII on historical orders when an
account is deleted. This is disclosed explicitly and un-softened in the
confirmation modal copy (`accountDeletion.whatIsKeptBody`) — do not water
this down to a generic "order history is kept" line in future copy edits.

- GraphQL: `src/graphql/mutations/AccountRequestDeletion.graphql` +
  `AccountDelete.graphql` (both additive, errors-only selection — no `user`
  field needed on either)
- Server actions in `account/actions.ts`: `requestAccountDeletion({redirectUrl,
channel})` (mirrors `updateAccount`'s `getAuthHeaders()` pattern) and
  `confirmAccountDeletion(token)` — the latter reads the access-token cookie
  itself first and returns `{ok:false, error:"NOT_AUTHENTICATED"}` before even
  calling the mutation if it's missing (handles: user requested deletion, then
  signed out or opened the email link in a different browser, before
  clicking it — `accountDelete` has no email/user-id arg, it operates on
  whoever is currently authenticated, so the token alone isn't sufficient).
  On success it clears both cookies directly via `cookies().set(..., {maxAge:
0})` rather than waiting for the client's `logout()` round trip — the
  deleted user's tokens are dead the instant the mutation succeeds.
- `DeleteAccountModal.tsx` (`src/ui/components/account/`) — reuses
  AuthModal's exact focus-trap/Escape/backdrop-click/body-scroll-lock
  pattern (copied inline, not extracted — AuthModal is context-driven global
  state, this is local `isOpen`/`onClose` props, different enough not to
  share a hook). Type-to-confirm: literal English word `"DELETE"`,
  case-sensitive, hardcoded as a `CONFIRM_WORD` constant — always English
  even in the Arabic UI (the instructional copy embeds the literal word
  inside the translated sentence in both locales), trimmed but not
  case-folded. All red/destructive styling uses `status-danger` Tailwind
  tokens (`text-status-danger`, `bg-status-danger`, `ring-status-danger/*`)
  from tokens.ts — never hardcoded `red-*` (existing components like
  AddressSection's delete-confirm still use hardcoded `red-*`; new
  destructive UI should follow tokens.ts instead, not that precedent).
- Wired into `SettingsSection.tsx` as a card below Security (and, since the
  Session 34 revision below, below the Download Your Data card too):
  `border-t-2 border-status-danger/40`, danger-tinted title/button, opens
  `DeleteAccountModal`.
- `DeleteAccountConfirm.tsx` + `/delete-account/page.tsx` — client component
  reading `?token=` via `useSearchParams` (page wraps it in `<Suspense>`,
  same requirement as `SetPasswordForm`/reset-password). Four states:
  missing token, not authenticated, expired/invalid token, success (shows a
  message then calls `logout()` from `useAuth` after a 2s delay — `logout()`
  POSTs `/api/auth/logout`, which is idempotent even though the cookies are
  already gone by that point).
- `requestAccountDeletion`'s `redirectUrl` is built client-side in
  `DeleteAccountModal` via `useParams<{locale;channel}>()` +
  `window.location.origin` as `${origin}/${locale}/${channel}/delete-account`
  — **do not** copy `ForgotPasswordForm`/`RegisterForm`'s existing
  `${origin}/reset-password` pattern, which omits the locale/channel path
  segments entirely; that pattern likely 404s against the real
  `/[locale]/[channel]/reset-password` route and was not used here.
- Verified end-to-end live against local Saleor: full round trip (settings →
  modal → request → email via Mailpit → `/delete-account?token=...` →
  confirm → account hard-deleted in DB → cookies cleared → redirected home
  logged-out), the case-sensitivity gate (`delete` stays disabled, `DELETE`
  enables), all 4 `/delete-account` states individually, and Arabic RTL (the
  modal's button order auto-mirrors correctly via plain `justify-end` — no
  manual RTL styling needed, consistent with this codebase's established
  "trust logical properties, verify visually" RTL approach).

### Session 34 revision (copy hardening + reason capture + data export)

- Retention disclosure (`whatIsKeptTitle`/`whatIsKeptBody`) rewritten with
  explicit legal framing (Amazon-style: "we are legally required to retain
  certain records... for tax, accounting, and fraud-prevention purposes")
  while keeping the specific PII callout (name/delivery address/phone on
  past orders) intact — both ideas are required, not either/or.
- New standalone permanence-warning callout (`permanenceTitle`/
  `permanenceBody`) added below the retention box, visually distinct via
  `status-warning` tokens (amber) vs. the retention box's `status-danger`
  (red) — tokens.ts does have a `status.warning` token, so no danger-token
  fallback was needed. Reuses the same `AlertTriangle` icon already imported
  for the modal header; two icons in one modal read fine here since they
  answer different questions (header = general severity, this box =
  specifically "you cannot undo or restore this").
- Optional "reason for closing" `<select>` added above the confirm input —
  a plain native `<select>`, not FilterBar's custom dropdown (FilterBar's
  pattern is for URL-param-synced multi-field filter bars; this is one
  optional field in a modal, so the native element is simpler and more
  accessible). Styled per `SupplierApplicationForm.tsx`'s established
  `@tailwindcss/forms` RTL-chevron fix (`bg-[right_0.75rem_center]
rtl:bg-[left_0.75rem_center]` — the chevron's `background-position` has no
  logical Tailwind utility, so it's flipped explicitly). 6 real reasons +
  "Prefer not to say" as the default/placeholder (empty value).
- If a reason is selected, `handleConfirm` fires `POST
/api/account-deletion-feedback` (new route, nodemailer, same transporter
  pattern as `/api/contact`) via `void fetch(...).catch(() => {})` —
  genuinely not awaited, so a slow/failed email can never delay or block the
  real `requestAccountDeletion` call right after it. The route maps the
  reason key to a fixed English label server-side (not routed through i18n
  — this is an internal ops email, always in English regardless of the
  customer's locale, so hardcoding the map there is correct, not a "zero
  hardcoded strings" violation). Recipient is `info@tawasiplus.com`,
  hardcoded — deliberately NOT reusing `/api/contact`'s `CONTACT_TO_EMAIL`
  env var (which defaults to a different address), per explicit instruction.
- **Operational finding, worth knowing before testing anything email-related
  in this project again**: `.env`'s `SMTP_HOST`/`SMTP_USER`/`SMTP_PASS` are
  configured for the **real production Zoho mailbox** (`info@tawasiplus.com`),
  not Mailpit, despite a comment above them saying "dev: Mailpit on
  localhost:1025". Confirmed by testing this feature live — the test
  request's feedback email actually sent to the real inbox, it did not show
  up in Mailpit. `/api/contact` shares this exact transporter config, so the
  same is true there. If local Mailpit catching is wanted for dev, `.env`
  needs `SMTP_HOST=localhost` / `SMTP_PORT=1025` explicitly — nobody should
  assume the comment reflects the actual configured values.
- New card "Download Your Data" added to `SettingsSection.tsx`, positioned
  between the Security card and the Delete Account card (non-destructive
  styling, same `rounded-2xl ring-1 ring-line-subtle` card shell as
  Personal Info/Security — no danger/warning tokens). Purely client-side:
  builds a JSON object from `user.orders`/`user.addresses` — both already
  present on the `user` prop via `CurrentUserOrderListQuery` (no new
  GraphQL query needed, per explicit instruction to reuse what
  Orders/AddressSection already fetch) — serializes with
  `JSON.stringify(data, null, 2)`, and triggers a download via
  `Blob` + a programmatically-clicked `<a download>` (`URL.createObjectURL`
  → click → `document.body.removeChild` → `URL.revokeObjectURL`).
  Filename: `tawasi-plus-my-data-{YYYY-MM-DD}.json`. No backend changes, no
  new mutations. Verified live: the download mechanism fires with the exact
  correct filename (confirmed by monkey-patching `HTMLAnchorElement.click`
  in the browser); full JSON-content inspection wasn't possible through the
  test tooling (blob: URLs aren't fetchable from the browser-automation
  injection context) but the data-construction code only reads fields
  already proven correct elsewhere (same fragments OrdersSection/
  AddressSection render from).

## Recently Viewed Products (Session 35)

Built on a diagnostic session against local Saleor 3.23.1 that confirmed:
`User.metadata` (public metadata) is writable by an authenticated customer on
their **own** `User` object with no staff/app permission required (unlike
`privateMetadata`, which is staff/app-only) — the top-level `user(id:)` query
is itself staff-gated, so there's no cross-user read/write leak despite the
field being permission-free at the field level. No size limit is enforced
anywhere in Saleor's app code for this version (only a non-empty-key check
exists — checked the actual source). `updateMetadata` is a full key-overwrite
only — no atomic array-append — and a live concurrent-write test showed
plain last-write-wins with no locking, which is an accepted, invisible risk
for this feature (very tight race between two product views could drop one
from the list).

- Storage: one metadata key, `"recentlyViewed"`, JSON-stringified array of
  `{slug, viewedAt}`, capped at 20, newest first, deduped (repeat view moves
  the existing entry to the front rather than adding a second one).
- GraphQL: `UserDetailsFragment` gained a `metadata { key value }` field
  (additive — flows into every `me` query that uses the fragment). New
  mutation file `UpdateUserMetadata.graphql` wraps `updateMetadata`. New
  query `ProductsBySlugs.graphql` batches slug→product resolution in one
  call via `products(filter: { slugs: $slugs }, first: 20, channel)` —
  confirmed via introspection that `ProductFilterInput.slugs` exists.
- `account/actions.ts`: `recordProductView(slug)` is fire-and-forget from the
  client (called via `void` in a `useEffect`, never awaited) — reads the
  access-token cookie directly (not `getAuthHeaders()`, since it also needs
  the raw token to decode `user_id` via `decodeJwtPayload` — same pattern
  `[channel]/layout.tsx` already uses to seed `AuthProvider`, avoiding an
  extra `me { id }` round trip), reads current metadata via the existing
  `CurrentUserDocument` (already carries `metadata` via the fragment above),
  computes the deduped/capped array, writes it back with one
  `UpdateUserMetadataDocument` call. Every step is wrapped in one try/catch
  that swallows all errors (`console.warn` in dev only) — a tracking failure
  must never surface on the PDP. `getRecentlyViewed()` is the read-only
  counterpart used by `account/page.tsx` to render the section.
- Trigger: `ProductInfo.tsx` (already a Client Component) — a `useEffect`
  keyed on `[isLoggedIn, product.slug]` calls `recordProductView`. Guests
  are simply never tracked (`isLoggedIn` guard). This is the only touch
  point on the PDP; `page.tsx` itself was not changed.
- Rendering: `account/page.tsx` (Server Component) calls `getRecentlyViewed()`
  then `ProductsBySlugsDocument`, builds a `Map<slug, product>` from the
  result and re-maps the ORIGINAL ordered slug list through it — this is
  what preserves newest-first order (Saleor's `slugs` filter does not
  guarantee result order) and is also what makes a deleted/unpublished
  product silently disappear from the list (its slug just isn't in the map).
  The resolved product array is passed down as a prop through
  `AccountDashboard` to `RecentlyViewedSection`, exactly like `orders`/
  `addresses` already are — `RecentlyViewedSection` cannot fetch its own
  data because `AccountDashboard` is a Client Component and can't host an
  async Server Component as a normal child.
- `RecentlyViewedSection.tsx` reuses `ProductElement` (the exact same
  component/grid `RelatedProducts` uses on the PDP) — no lighter card
  variant was needed. Empty state reuses `EmptyState` with a `History`
  lucide icon.
- Verified end-to-end live: fresh product view gets tracked, revisiting an
  already-tracked product moves it to the front with a fresh timestamp
  without duplicating (array length stays constant), the Account SPA section
  renders the correct newest-first order using real `ProductElement` cards
  (pricing/variants/Add-to-Cart all functional), and Arabic RTL (grid mirrors
  correctly with zero manual RTL code, consistent with this codebase's other
  sections).
- **Do not copy `ForgotPasswordForm`/`RegisterForm`'s existing
  `${origin}/reset-password` redirectUrl pattern for anything new** — it
  omits the `/{locale}/{channel}` path segments that the actual
  `/[locale]/[channel]/reset-password` route requires, and almost certainly
  404s. Not touched/fixed here (out of scope), but noted so it isn't
  accidentally propagated into new code.

## Account Confirmation & Password Reset Redirect Fix (Session 36)

Diagnostic session (same session, read-only pass first) confirmed two broken
production flows: account-confirmation emails had **no page to land on at
all** (no `confirmAccount`/`accountConfirm` mutation call existed anywhere in
the app, no confirm-account route), and password-reset emails landed on the
**homepage** instead of `/reset-password`. Root cause for the reset-password
symptom: `RegisterForm.tsx` and `ForgotPasswordForm.tsx` both built
`redirectUrl` as `${window.location.origin}/reset-password` — a bare path
missing the required `/{locale}/{channel}` segments. Saleor appends
`?email=...&token=...` to that path and emails it verbatim; when clicked,
next-intl's locale-prefix middleware rewrites the locale-less path to
`/en/reset-password`, and the App Router then resolves that 2-segment path
as `locale=en, channel="reset-password"` — since `[channel]/layout.tsx`
never validates the channel param against real Saleor channels, and `(main)`
is a route group (adds no URL segment), the router falls through to
`(main)/page.tsx` (the homepage) with `channel` bound to the literal string
`"reset-password"`. Same mechanism would have broken confirm-account links
too, had a confirm-account page existed.

- **Fix in both forms**: `redirectUrl` is now built via `useLocale()` (next-intl)
  - `useParams<{ channel }>()`, e.g.
    `` `${origin}/${locale}/${encodeURIComponent(channel)}/reset-password` ``
    (ForgotPasswordForm.tsx) and `.../confirm-account` (RegisterForm.tsx).
    Verified live by monkey-patching `window.fetch` in the browser and
    inspecting the actual outgoing request body for both forms — confirmed
    `redirectUrl` resolves correctly (e.g.
    `http://localhost:3000/en/uae-channel/reset-password`).
- **New account-confirmation flow** (previously entirely missing):
  - Schema was introspected first (via `src/gql/graphql.ts`, not assumed) —
    the correct mutation is `confirmAccount(email: String!, token: String!):
ConfirmAccount { user { id email } errors { field message code } }`, NOT
    `accountConfirm`. No `token`/`refreshToken` is returned — this mutation
    only activates the account, it does not log the user in.
  - `src/graphql/mutations/AccountConfirm.graphql` — new additive file (no
    existing .graphql file touched), `pnpm run generate` run after
    (generates `AccountConfirmDocument`; project's actual codegen script is
    `generate`, not `codegen` — there is no `codegen` package.json script).
  - `src/app/api/auth/confirm-account/route.ts` — mirrors
    `set-password/route.ts`'s pattern exactly: raw inline mutation string +
    direct `fetch()` to `SALEOR_API_URL` (not `executeGraphQL`/the generated
    Document, to match the existing set-password/route.ts convention this
    was asked to mirror); maps `INVALID`/`NOT_FOUND` AccountErrorCode →
    `TOKEN_INVALID`, never leaks raw Saleor error messages.
  - `src/app/[locale]/[channel]/(main)/confirm-account/page.tsx` +
    `src/ui/components/auth/ConfirmAccountClient.tsx` — same
    Suspense-wrapped Server Component page shell as `reset-password/page.tsx`
    / `delete-account/page.tsx`. Client component reads `email`+`token` from
    `useSearchParams()`, fire-once (`ranRef` guard) POSTs to the new route on
    mount, three states (pending spinner / success checkmark / error X) using
    framer-motion fade+scale matching `EmptyState.tsx`/the `(main)/error.tsx`
    visual language — tokens only (`status-success`/`status-danger`/
    `brand-primary`), both success and error CTA use `LinkWithChannel` to
    `/login`. A missing/malformed `email` or `token` in the URL short-circuits
    straight to the error state without ever calling the API.
  - New `confirmAccount` i18n namespace (en + ar formal MSA): pageTitle,
    pending, successTitle, successSubtitle, errorTitle, errorSubtitle,
    loginButton — zero hardcoded strings.
  - Verified live against local Saleor in both `en` and `ar` (RTL): the
    error state renders correctly for an invalid token (real 400 from
    Saleor's `confirmAccount`), and the missing-token/email case
    short-circuits to the same error state with no network call.
- `pnpm tsc --noEmit`: 0 errors. `pnpm lint`: 6 warnings (baseline is ≤7 —
  the pre-existing 6 src/checkout/ warnings; the Logo.tsx warning didn't
  print this run but the count stayed under baseline either way, no new
  warnings introduced).
- beads: front_store-69c created and closed (see issue for full resolution
  notes).

## Country of Origin (Session 37)

Multi-select "Country of Origin" PLP filter plus flag badges on the PLP card
and PDP gallery, built against the Saleor "origin-of-country" attribute
(Dropdown type, up to 32 country values, product-to-country assignment done
manually in the Dashboard and ongoing — not every product has it set).

- **Single source of truth**: `src/lib/countryOrigin.ts` — new file, exports
  `COUNTRY_ORIGINS` (32 entries: `slug`/`nameEn`/`nameAr`/`flagCode`, the
  `slug` matching the Saleor AttributeValue slug exactly), `getCountryBySlug()`
  (returns `undefined` rather than throwing when a slug doesn't match — the
  attribute may be unassigned or a Dashboard value may not exist in this
  list yet), and `getFlagUrl(flagCode, width)` wrapping
  `https://flagcdn.com/w{width}/{flagCode}.png` (already whitelisted via
  next.config.ts's `https://**` remotePatterns wildcard — no config change
  needed).
  `src/ui/components/home/CountrySection.tsx`'s own `COUNTRIES` export (11
  countries, used by the homepage carousel and by
  `SupplierApplicationForm.tsx`'s unrelated "Country of Operation" select)
  now derives its data from `getCountryBySlug()` for a curated
  `HOMEPAGE_COUNTRY_SLUGS` list instead of hardcoding names/codes a second
  time — the `emoji` field (not part of the central mapping, decorative only,
  still used by `SupplierApplicationForm.tsx`) stays as a small local
  `HOMEPAGE_COUNTRY_EMOJI` map. Export shape (`slug`/`nameEn`/`nameAr`/`code`/
  `emoji`) is unchanged, so neither consumer needed changes. Confirmed live
  the homepage carousel still renders all 11 flags/names correctly after the
  refactor.
- **GraphQL (additive only — no existing .graphql file edited)**:
  - `src/graphql/fragments/ProductOriginAttribute.graphql` — new fragment on
    `Product`: `attributes { attribute { slug } values { slug name
translation(languageCode: $language) { name } } }`. Existing
    `ProductDetails.graphql` already fetched a generic `attributes` block for
    the PDP's specifications table, but without `slug` on either `attribute`
    or `values` — there was no reliable, locale-independent way to identify
    "this is the origin-of-country row" (matching on display name is
    locale-fragile) or to get the value's slug needed to look up
    `getCountryBySlug()`. This new fragment is the only place `slug` is
    fetched, and both new operations below spread it.
  - `src/graphql/ProductListPaginatedWithOrigin.graphql` — new query, same
    shape as `ProductListPaginated.graphql` (still untouched, still used
    nowhere now but left in place) but the product node spreads both
    `...ProductListItem` and `...ProductOriginAttribute`.
    `products/page.tsx` now calls `ProductListPaginatedWithOriginDocument`
    instead of `ProductListPaginatedDocument`.
  - `src/graphql/ProductOriginDetails.graphql` — new query,
    `product(slug, channel) { id ...ProductOriginAttribute }`. Called via
    `Promise.all` alongside the existing `ProductDetailsDocument` call in
    `products/[slug]/page.tsx` (one extra request, kept separate rather than
    editing `ProductDetails.graphql`).
  - `pnpm run generate` run after adding these — confirmed
    `ProductOriginAttributeFragment`, `ProductListPaginatedWithOriginQuery`,
    `ProductOriginDetailsQuery` all generated with `attribute.slug: string`
    (non-null) and `values[].slug: string | null` (nullable — filter/find
    defensively, never assume index 0 exists or has a slug).
- **PLP filter** (`src/ui/components/products/FilterBar.tsx`,
  `products/page.tsx`): `?country=` is now a comma-separated list
  (`?country=syria,lebanon`), parsed to `string[]` in `products/page.tsx` and
  passed as `filter.attributes = [{ slug: "origin-of-country", values:
countries }]` — `AttributeInput.values` already accepted `Array<string>`
  with OR semantics ("filters results to include only records with one of
  the matching values") _before_ this session, so multi-select needed zero
  schema/API changes, only parsing changes on the storefront side.
  `FilterBar`'s prop changed from `activeCountry?: string` to
  `activeCountries?: string[]` (default `[]`). New desktop dropdown +
  mobile-bottom-sheet section (positioned like the existing Sort/Category
  controls) lists all 32 `COUNTRY_ORIGINS` as a flag + localized-name
  checkbox-style toggle list (immediate toggle on click, no explicit Apply —
  matches the Sort/Category pattern, not the Price Range pattern). The old
  single dismissible pill became a pill list (one per active country,
  independently removable via `toggleCountry`), still rendered in the shared
  strip above both the desktop bar and the mobile view. `hasActiveFilters`
  and `clearAllFilters` cover the new array. New i18n keys in the
  `products` namespace: `countryOfOrigin` ("Country of Origin" /
  "بلد المنشأ"), `origin` ("Origin: {country}" / "المنشأ: {country}" —
  interpolated, also reused for the PDP badge and PLP card tooltip text).
  **Known limitation** (explicitly accepted, not a bug): the dropdown lists
  all 32 countries from `countryOrigin.ts`, not just ones actually assigned
  to an in-stock/available product in this channel — Saleor has no
  straightforward query to derive "distinct attribute values actually in use
  across available products in a channel" without a full product scan, so
  selecting an unused country will correctly show "0 products" rather than
  being hidden from the list.
- **PLP card badge** (`src/ui/components/ProductElement.tsx`): small flag-only
  corner badge (`next/image`, ~24×16px, `title` attribute shows the
  localized country name) rendered when the product's `attributes` array
  (now present because `products/page.tsx` passes the
  `ProductListPaginatedWithOrigin` query's product nodes through) has an
  `origin-of-country` entry with a resolvable `getCountryBySlug()` slug.
  Positioned at physical `left-2 top-2` — deliberately the opposite corner
  from the existing OOS badge at `right-2 top-2`, matching that badge's
  existing non-logical (not RTL-flipping) convention rather than introducing
  a mixed logical/physical positioning scheme on the same card; confirmed
  visually correct in both `en` and `ar`. `ProductElement`'s prop type is
  `ProductListItemFragment & { attributes?: [...] }` (attributes optional) —
  every other `ProductElement` call site (`RelatedProducts`,
  `CartRecommendations`, `RecentlyViewedSection`, search/collections/
  categories pages, which still use the plain `ProductListItemFragment`-based
  queries) simply has no `attributes` field at runtime and renders no badge;
  only the main PLP (`products/page.tsx` → `ProductList.tsx`) has origin data
  today. No component changes were needed in `ProductList.tsx` — structural
  typing lets the wider query-result type flow through a variable typed
  `ProductListItemFragment[]` transparently.
- **PDP badge** (`src/ui/components/pdp/ProductGallery.tsx`): pill badge
  (flag + `t("origin", {country})`) absolutely positioned at logical
  `start-3 top-3` over the main gallery image (kept logical, unlike the PLP
  card badge, since this is new standalone overlay markup with no existing
  physical-positioning precedent to match in this file — the pre-existing
  zoom-icon overlay stays at its own `bottom-3 right-3`). Purely decorative
  (no onClick), so it doesn't intercept the image's lightbox-open click
  handler. `originCountry` is resolved server-side in
  `products/[slug]/page.tsx` (via the `ProductOriginDetails` query above) and
  passed down as a plain serializable prop; `ProductGallery` picks
  `nameAr`/`nameEn` itself via `useLocale()`. Renders nothing when the
  product has no origin-of-country value.
- Verified end-to-end live against local Saleor data (products already
  carrying a real origin-of-country value, e.g. "Lemon Super Seeds" →
  Egypt): PLP multi-select filter (`?country=syria,egypt` → correct OR
  result count, both pills, both dropdown checkmarks; removing one pill
  narrows the URL back to a single slug), PLP card flag badge, PDP gallery
  badge (`🇪🇬 Origin: Egypt`), full Arabic/RTL pass (dropdown + pills +
  both badges mirror correctly, verified with live screenshots per this
  project's established "verify visually, don't assume" RTL rule), and
  mobile bottom-sheet multi-select (toggling a country closes into the
  correct filtered URL, sheet stays open across toggles matching the
  existing Sort/Category behavior).
- `pnpm tsc --noEmit`: 0 errors. `pnpm lint`: 6 warnings (baseline, all
  pre-existing in `src/checkout/`) — no new warnings introduced.
- beads: front_store-m0e (see issue for full resolution notes).

## GA4 E-commerce Funnel Tracking (Session 37)

Full funnel instrumentation: view_item → add_to_cart → view_cart →
begin_checkout → add_shipping_info → add_payment_info → purchase. Built on
a diagnostic pass (same session) that mapped every insertion point before
any code was written.

- **No new dependency**: the diagnostic assumed `next/third-parties/google`
  ships inside the installed `next` package — confirmed false during
  implementation (`@next/third-parties` is a separate, uninstalled package
  in this Next.js 15.5.6 install; `find node_modules/next -iname "*third*"`
  returns nothing). Per the "no new dependencies without asking" rule, GA is
  instead loaded via the standard `next/script` component (genuinely bundled
  in `next` core, verified present at `node_modules/next/script.js`) with
  the plain gtag.js snippet (two `<Script strategy="afterInteractive">` tags
  — one loading `googletagmanager.com/gtag/js`, one initializing
  `dataLayer`/`gtag`) — same end result as `<GoogleAnalytics>`, zero new
  packages.
- `NEXT_PUBLIC_GA_MEASUREMENT_ID` added to `.env.example` (empty value). Not
  set in local `.env` — the `<Script>` tags render conditionally
  (`{gaMeasurementId && ...}`) and are simply omitted when unset, so local
  dev is unaffected and `window.gtag` never exists in dev today.
- **Central helper**: `src/lib/analytics/gtag.ts` — one typed function per
  event (`trackViewItem`, `trackAddToCart`, `trackViewCart`,
  `trackBeginCheckout`, `trackAddShippingInfo`, `trackAddPaymentInfo`,
  `trackPurchase`), all routed through a private `sendEvent()` that no-ops
  when `window.gtag` isn't defined (`typeof window !== "undefined" &&
window.gtag` guard) — safe with GA unconfigured. `currency` is hardcoded
  `"AED"` throughout (this storefront has one currency). Exports the
  `GA4Item` type (`item_id`/`item_name`/`item_category`/`price`/`quantity`).
  No inline `window.gtag(...)` calls exist anywhere else in the codebase —
  every call site imports from this file.
- **view_item** + **add_to_cart (PDP path)**:
  `src/ui/components/pdp/ProductInfo.tsx` — a new `useEffect` keyed on
  `[product.id]` only (fires once per product load, ungated by
  `isLoggedIn` — unlike the adjacent `recordProductView` effect, which stays
  guest-excluded on purpose). `trackAddToCart` call added in
  `handleAddToCart()` right after the `result.ok` success check, using
  `selectedVariant` for id/price and the same product name/category the
  page already displays.
- **add_to_cart (PLP/card path)**: `ProductAddButton.tsx` had no product
  name/price/category in scope (only `selectedVariantId`/`isAvailable`/
  `hasMultipleVariants`) — 3 new optional props (`productName`,
  `categoryName`, `price`) threaded in from its only caller,
  `ProductElement.tsx` (which already computes all three for its own
  display). `trackAddToCart` fires in `handleClick()` on `result.ok`,
  `item_id` = `selectedVariantId` (no product id available at this layer).
- **view_cart**: `src/app/[locale]/[channel]/(main)/cart/page.tsx` is a
  Server Component and cannot call `gtag` itself. New file
  `src/ui/components/cart/CartViewTracker.tsx` ("use client", renders
  `null`) exists solely as the client boundary — mounted inside
  `OrderSummary.tsx` (still a Server Component; this is a standard RSC
  parent-renders-client-child, same pattern `ProductInfo` already
  represents on the PDP), `useEffect` keyed on `[checkoutId]` fires once per
  cart load. Item list built from `lines` already passed into
  `OrderSummary`.
- **begin_checkout**: `src/checkout/sections/CheckoutForm/CheckoutForm.tsx`
  — new `useEffect(() => {...}, [])` (empty deps, fires once on mount only)
  near the existing `useState` block, reading `checkout` from the
  already-destructured `useCheckout()` return value (reading its off-limits
  source file's exported value is fine; the file itself was not edited — a
  type-only reference via `ReturnType<typeof useCheckout>` was used for the
  local `getCheckoutItems()` mapper instead of importing anything from
  `src/checkout/graphql/`).
- **add_shipping_info** + **add_payment_info**: same file — a new
  `handleContinueToPayment()` wraps the existing `goNext("payment")` call
  (the "Continue to Payment" button's `onClick` now points at the wrapper
  instead of calling `goNext` directly); both events fire together here per
  GA4 semantics. `shipping_tier` resolved by matching
  `checkout.deliveryMethod.id` against `checkout.shippingMethods[]` (the
  fragment's `deliveryMethod` union only carries `id`, not `name`).
  `payment_type` is deliberately omitted from `add_payment_info` — it isn't
  derivable outside the off-limits `AdyenDropIn`/`StripeElements` adapters.
  **Known data gap**: `CheckoutLineFragment` (in the off-limits
  `src/checkout/graphql/checkout.graphql`) has no product id — `variant.id`
  stands in as `item_id` for all three checkout-step events. Do not add a
  product-id field to that fragment to "fix" this; it's off-limits.
- **purchase**: `src/checkout/views/OrderConfirmation/OrderConfirmation.tsx`
  — new `useEffect` keyed on `[order?.id, order?.number,
order?.total?.gross?.amount, order?.lines]`, deduplicated via a
  `sessionStorage` flag (`ga4_purchase_tracked_${order.id}`) so a refresh on
  the confirmation URL doesn't refire the event (wrapped in try/catch —
  private-mode/sessionStorage-unavailable browsers still get one event per
  mount rather than being blocked entirely). **Known data gap**:
  `OrderLineFragment` has no product/variant id at all (only
  `variant.name`) — the order line's own `id` is used as `item_id` instead;
  `item_category` is omitted from purchase items (not present in this
  fragment). `transaction_id` = `order.number ?? order.id`.
- **Verified live** (local Saleor, `pnpm dev`, real browser pass): homepage,
  PLP (131 products, PLP add-to-cart click → cart badge incremented, zero
  console errors), PDP (`Lemon Super Seeds`, add-to-cart click, zero console
  errors), cart page (`CartViewTracker`'s null-render caused no layout
  disruption), and the checkout wizard's Contact → Shipping transition (form
  fill + "Continue to Shipping" click rendered step 2 correctly, zero
  console errors) — all with `NEXT_PUBLIC_GA_MEASUREMENT_ID` unset locally,
  confirming every `trackX()` call's `window.gtag` guard no-ops silently
  rather than throwing.
- `pnpm tsc --noEmit`: 0 errors. `pnpm lint`: 6 warnings (baseline,
  pre-existing in `src/checkout/`) — no new warnings introduced.
- Off-limits files confirmed untouched via `git diff --name-only`: nothing
  under `src/checkout/hooks/`, `src/checkout/state/`, `src/checkout/graphql/`,
  `src/checkout/sections/PaymentSection/AdyenDropIn/`, or
  `src/checkout/sections/PaymentSection/StripeElements/` appears in the
  diff.

## Checkout Customer Recognition (Session 38)

Bug: a logged-in customer (valid `saleor_token` cookie) reaching `/checkout`
was shown the register/login prompt and never offered their saved
addresses — treated exactly like a guest. Root cause, confirmed by a
read-only diagnostic pass before any code was touched: **this app runs two
separate, unbridged auth systems.** The main storefront uses the custom
`src/lib/auth/` JWT stack (httpOnly `saleor_token`/`saleor_refresh_token`).
The checkout sub-app (`src/checkout/`) — a top-level route at
`src/app/[locale]/checkout/`, **outside** `[channel]` and therefore outside
the main `AuthProvider` — is wrapped in its own, separate
`src/ui/components/AuthProvider.tsx`, built on `@saleor/auth-sdk`
(`SaleorAuthProvider` + `createSaleorAuthClient`). The checkout's client had
never once seen the main app's login state.

The important finding: `src/checkout/`'s customer-recognition logic was
**already fully built and correct** — `useUser()`, the auto-firing
`useCustomerAttach()` hook (calls the real `checkoutCustomerAttach`
mutation, already defined in `src/checkout/graphql/checkout.graphql`), and
`UserShippingAddressSection` (backed by the checkout's own `me { addresses
}` query in `src/checkout/graphql/user.graphql`) were all dead code purely
because `useUser()`'s `authenticated` flag was always `false`. None of that
needed to change, and **no file under `src/checkout/` was touched** for
this fix, per the diagnostic's off-limits assessment.

- **Fix — entirely in `src/middleware.ts`**: `@saleor/auth-sdk`'s
  `SaleorAuthClient.fetchWithAuth` has a built-in one-shot bridge (see
  `node_modules/@saleor/auth-sdk` `SaleorAuthClient` source) — on first use
  it reads a plain, **non-httpOnly** cookie literally named `token` via
  `document.cookie`, adopts it as the checkout's access token, then deletes
  the cookie itself. The main app's login flow never set that cookie.
  Middleware now sets it — `httpOnly: false`, `sameSite: "lax"`, `secure` in
  production, `maxAge: 60` seconds — **only** when the request path is
  `/checkout` (locale-prefixed: `/en/checkout` or `/ar/checkout`, matched
  via a new `isCheckoutPath()` helper) **and** a valid access token is
  present (using the just-refreshed token if the existing silent-refresh
  block ran this request). Guests, and every other route, are completely
  unaffected — the cookie is never set when `saleor_token` is absent, and
  its 60s lifetime plus the SDK's own self-delete-on-read minimize how long
  a JS-readable token cookie exists in the browser.
- **Known limitation, by design, not fixed here**: the bridge only seeds the
  checkout SDK's **access token** (short-lived). Its refresh token remains
  in `window.localStorage` (never populated — the real refresh token stays
  httpOnly in `saleor_refresh_token`), so a very long-lived checkout session
  will eventually have the access token expire and silently fall back to
  guest UI. Acceptable for a normal checkout session length; flagged here so
  a future session doesn't mistake it for a regression.
- Verified live end-to-end (local Saleor, real browser, `admin@example.com`
  test login — the only account with a known password in this environment,
  see `saleor_platform/README.md`): Contact step renders the **signedInUser**
  state (`Account` / `admin@example.com` / `Sign out`), not the guest
  prompt; network tab confirms `checkoutCustomerAttach` fires with `errors:
[]` and the checkout's `user` becomes attached; `UserShippingAddressSection`
  renders the account's real saved address (`132 Mclean Meadow Suite 446,
Chelsealand`) as a selectable radio option; signing out and returning to
  `/checkout` correctly falls back to the guest Contact-details form with no
  errors; the bridge `token` cookie was confirmed **absent** via
  `document.cookie` on the homepage, `/products`, and `/cart` both logged in
  and logged out — it only ever appears (briefly) on `/checkout`.
- `pnpm tsc --noEmit`: 0 errors. `pnpm lint`: 6 warnings (baseline,
  pre-existing in `src/checkout/`) — no new warnings introduced.
  `git diff --name-only`: only `src/middleware.ts` changed.
- beads: front_store-qja created and closed (see issue for full resolution
  notes).

## Legal Pages Migrated to Saleor CMS (Session 38)

Diagnostic session (read-only first pass) found the task's original premise
was wrong: `pages/[slug]/page.tsx` had **no** special-case branches for
`"privacy-policy"`, `"terms"`, or `"cookies"` — only `contact-us`,
`wholesale`, `become-supplier`, and `about` are hardcoded to dedicated
client components. [Footer.tsx](src/ui/components/Footer.tsx) already linked
to `/pages/privacy-policy`, `/pages/terms`, `/pages/cookies` via the generic
route. These three slugs simply had **no Saleor Page record at all**, so
they 404'd — there was nothing to remove from the code. `refund-policy` was
in the same situation, plus needed as a brand-new page.

- **No code changes were made this session** — this was a pure content
  operation. `pnpm tsc --noEmit`: 0 errors. `pnpm lint`: 6 warnings
  (baseline, pre-existing in `src/checkout/`).
- **Content format** (confirmed by inspecting `PageGetBySlug.graphql` +
  the `edjsHTML()` parser actually bundled — `editorjs-html@3.4.3`, no
  custom block parsers registered): `Page.content` is a JSON **string**
  in EditorJS block format (`{time, blocks: [...], version}`). Only
  `header`, `paragraph`, `list`, `image`, `quote`, `code`, `delimiter`,
  and `embed` (YouTube/Vimeo only) block types are supported — anything
  else throws. `list` blocks use `{style: "ordered"|"unordered", items:
[...]}`. Inline HTML (`<b>`, `<a href>`) inside a `paragraph`/`list` item's
  `text`/string is passed through as-is by the parser, then sanitized by
  `xss()` before render — this is how the existing `about` page's content
  already worked, confirmed live from the real DB record.
- 4 pages created via `pageCreate` (English base content) +
  `pageTranslate(languageCode: AR)` (Arabic translation) — **not** 8
  separate pages — using the `"Simple"` page type (same one `about`/
  `contact-us` already use). All `isPublished: true`.
  - `privacy-policy` / `terms` / `cookies` / `refund-policy` (new)
- **Important local-env finding, worth knowing before touching Saleor data
  from a script again**: this machine has **two independent Saleor
  backend processes both listening on port 8000** — one reachable via
  IPv4 (`127.0.0.1:8000`, hit by default from `curl`/Python), and a
  **different one** reachable via IPv6 (`[::1]:8000`, hit by default from
  Node's `fetch`/undici, and therefore by the Next.js dev server's own
  server-side fetches to `NEXT_PUBLIC_SALEOR_API_URL=http://localhost:8000`)
  — confirmed via `netstat -ano`: PID 13280 (`com.docker.backend.exe`,
  wildcard `0.0.0.0`/`[::]`), PID for a `127.0.0.1`-only listener, and a
  separate `wslrelay.exe` PID for an `[::1]`-only listener. These are two
  **separate databases** (not just two paths to the same one) — a page
  created via plain `curl http://localhost:8000/...` did not appear when
  the Next dev server queried the same URL. A JWT minted against one
  instance also fails signature verification against the other. **Fix**:
  always mint the auth token AND run every subsequent query through the
  exact same fetch mechanism the app itself uses (Node `fetch()` with no
  `--dns-result-order` override), never mix `curl` and Node `fetch()` calls
  against `localhost:8000` in the same script. This was not previously
  documented and cost real time to diagnose — check `netstat -ano | grep
:8000` first if a mutation "succeeds" but its effect isn't visible in the
  app.
- **Known content issue, not fixed (content-authoring, not code)**: the
  privacy-policy page's own body contains a raw `<a href="/pages/cookies">`
  link (from the user-supplied EditorJS JSON) missing the `/{locale}/
{channel}` prefix — this hits the same broken-redirect pattern documented
  under "Account Confirmation & Password Reset Redirect Fix (Session 36)"
  (a bare `/pages/...` path resolves to `channel="pages"` via the locale
  middleware, not the actual page). The Footer's own links are correct
  (`LinkWithChannel` adds the prefix automatically) — only this one inline
  content link is affected. Fixing it means editing the Page content in
  the Dashboard (or via `pageTranslate`/`pageUpdate`), not code.
- Verified live in both locales for all 4 slugs: `/en/uae-channel/pages/
{privacy-policy,terms,cookies,refund-policy}` and the `/ar/uae-channel/...`
  equivalents — correct title, correct AR translation (not an EN fallback),
  correct RTL rendering (screenshot-verified on refund-policy), zero new
  console errors.

## Delivery Countdown Cutoff Fix (Session 39)

Bug: `CheckoutCountdown.tsx`'s delivery-day cutoff logic did not match the
business rule. **This supersedes the Session 26/27 changelog entries above**
for this component — those entries describe a 13:00/22:00 UAE two-boundary
window that is no longer what the code does; they're left in place only as
history, not as current behavior.

Diagnostic (prior session, read-only) found the component itself was
already correct in every respect except the two boundary constants: fixed
UTC+4 offset math (no browser-timezone dependency), correct day-rollover
handling, and bilingual hardcoded text (no i18n keys exist for this
component — none were introduced, consistent with the established pattern)
were all sound and preserved as-is.

- **Fix — constants only**, in
  [`src/ui/components/checkout/CheckoutCountdown.tsx`](src/ui/components/checkout/CheckoutCountdown.tsx)'s
  `getDeliveryInfo()`: boundary `13` → `8`, boundary `22` → `20`, countdown
  target `18` (UTC, was 22:00 UAE) → `16` (UTC, = 20:00 UAE), countdown
  target `9` (UTC, was 13:00 UAE) → `4` (UTC, = 08:00 UAE). Correct rule now
  encoded: **08:00–20:00 UAE → "tomorrow" delivery, countdown to today's
  20:00 UAE; 20:00–08:00 UAE → "day after tomorrow" delivery, countdown to
  the next 08:00 UAE.** No other file touched — this component has no
  dependents beyond `checkout/page.tsx`'s existing import.
- Verified with a throwaway Node script (not committed) iterating all 24
  UAE hours through the exact post-fix logic: label flips precisely at
  08:00 and 20:00, target UTC hour is 16 for the whole `[8,20)` range and 4
  for the whole `[20,8)` range (wrapping correctly across midnight), and
  target is always in the future relative to `now` — output matched the
  required table exactly before any live check was attempted.
- Live sanity check (local Saleor, real browser, real system time — UAE
  21:25 at test time, inside the 20:00–08:00 window): checkout page
  rendered "Order now for day-after-tomorrow's delivery" with a countdown
  of ~10h34m to the next 08:00 UAE, matching the expected math exactly;
  zero console errors.
- `pnpm tsc --noEmit`: 0 errors. `pnpm lint`: 6 warnings (baseline,
  pre-existing in `src/checkout/` — this file is not in that directory and
  introduced zero new warnings, not merely "under baseline").
- beads: front_store issue created and closed (see issue for full
  resolution notes).

## Footer Updates — Legal Links, Refund Policy, Supplier Move, Tagline (Session 40)

Three changes to [Footer.tsx](src/ui/components/Footer.tsx)'s Variant A (the
main 4-column grid) — Variant B (the bottom-bar mini legal links, Terms +
Privacy Notice only) was explicitly left untouched.

- **Legal column**: `legalLinks` array (~line 110) is now Privacy Policy →
  Terms of Service → Cookie Policy → Refund Policy (new, `/pages/refund-policy`).
  "Become a Supplier" removed from this array entirely.
- **Explore column — "Become a Supplier" moved to the CMS-driven "footer"
  Saleor menu**, not hardcoded. Real technical finding this required a code
  fix for: `MenuItemCreateInput.url` (and the frontend menu's `child.url`
  field generally) is a Django `URLField` — it **rejects** a relative path
  like `/pages/become-supplier` ("Enter a valid URL."), so a CMS menu item
  can only ever store a full absolute URL. But `LinkWithChannel.tsx` only
  prepends `/{locale}/{channel}` to values that already start with `/` —
  handing it a raw absolute URL (e.g. `http://localhost:3000/pages/x`)
  skips that prefixing entirely, producing a locale-less link that resolves
  to the wrong route (same failure class as the Session 36 reset-password
  bug). Fixed generally, not as a one-off: `Footer.tsx` now has
  `KNOWN_STOREFRONT_HOSTNAMES` (`localhost`, `127.0.0.1`, `tawasiplus.com`,
  `www.tawasiplus.com`) and a `toInternalHref()` helper — if a menu item's
  `url` parses to one of those hostnames, only the pathname+search+hash is
  passed to `LinkWithChannel` (so it gets correctly locale/channel-prefixed
  on whichever environment renders it); any other hostname passes through
  completely unchanged (genuine external links keep working exactly as
  before, since `LinkWithChannel` already no-ops on non-`/`-prefixed
  hrefs). This is reusable for any future CMS menu item that needs to link
  internally — no per-item special-casing required.
  - No Saleor Page exists for `become-supplier` (it's the fully hardcoded
    `SupplierPageClient` route, same pattern as `contact-us`) — so the new
    menu item was created with `url: "http://localhost:3000/pages/become-supplier"`
    (local) rather than a `page:` reference. Production's equivalent must
    use `url: "https://tawasiplus.com/pages/become-supplier"` — the
    `toInternalHref()` fix handles both automatically once the domain is in
    the known-hostnames list, which it already is.
  - Footer "footer" menu structure (local, confirmed via introspection):
    one top-level item **"Green Line"** (id `TWVudUl0ZW06MjIw`, itself never
    rendered — `Footer.tsx` only iterates `item.children`) with 3 children
    in order: **About** → page `about`, **Contact us** → page `contact-us`,
    **Become a Supplier** (new, id `TWVudUl0ZW06MjQ3`) → `url`-based per
    above. AR translation added via `menuItemTranslate(id, {name}, AR)` —
    `NameTranslationInput` has exactly one field, `name: String` (confirmed
    via schema introspection, not guessed).
  - **Operational gotcha, cost real time**: the first `menuItemTranslate`
    call, sending the Arabic name inline via `curl -d '{"query":...}'` in
    Git Bash on Windows, silently corrupted the Arabic text into literal
    `?` characters — and it was genuinely **stored** that way in the DB
    (confirmed by re-querying fresh via a different method), not just a
    terminal-display artifact. Root cause: Windows/MSYS argv doesn't
    reliably preserve UTF-8 multi-byte sequences passed as an inline `-d`
    string. **Fix**: write the mutation payload (query + variables,
    including any non-ASCII content) to a `.json` file via the `Write` tool
    first, then send it with `curl --data-binary @file.json` — never pass
    Arabic/non-ASCII content inline via `-d` in this environment again. The
    corrupted value was overwritten with a correct second call using this
    method; verified correct on re-query.
  - Verified live: EN Explore column shows "Become a Supplier" →
    `/en/uae-channel/pages/become-supplier`; AR shows "كن مورّداً لنا" →
    `/ar/uae-channel/pages/become-supplier` (locale-correct in both
    directions, not a fixed locale regardless of which was clicked);
    navigated to the AR URL directly and confirmed the real
    `SupplierPageClient` page renders (not a 404).
  - **Production not yet done this session** — needs a production App
    token with `MANAGE_MENUS` (same as local) before the same two mutations
    (`menuItemCreate` + `menuItemTranslate`, with the `https://tawasiplus.com/...`
    url) can be safely run there via SSH + `docker exec`, per this
    project's established rule of never using a bare `localhost`/`127.0.0.1`
    call to reach production and never falling back to superuser
    credentials.
- **Tagline** (`description` at ~line 96, brand Column 1, hardcoded — not an
  i18n key, confirmed neither string exists in `en.json`/`ar.json`):
  replaced the short "Curated collections for the discerning eye." /
  "مجموعات مختارة بعناية لذوق رفيع." with a longer, brand-specific line
  naming Green Line Group and the product range. The new EN/AR strings are
  ~3.5x longer, wrapping to an estimated 3–4 lines instead of 1 at both the
  375px and 1280px breakpoints (desktop is actually narrower per-column
  than mobile here — the brand column is 1-of-4 grid columns on desktop
  `lg:grid-cols-4` vs. 1-of-1 full-width on mobile `grid-cols-1`). Accepted
  as-is: Tailwind's CSS Grid gives each footer column independent height,
  so a taller Column 1 doesn't clip or overflow the grid, just grows taller
  than Columns 2–4 — a normal, safe footer pattern, confirmed via
  `getComputedStyle` (correct dark background, `display:block`,
  `opacity:1`, `visibility:visible` on the footer element throughout) even
  though a pixel screenshot could not be captured this session (see below).
- **Browser-pane tooling note, not an app bug**: screenshots and
  `getBoundingClientRect()` geometry were unreliable for any scrolled
  position in the Browser pane across this session and the one before it —
  reproducibly blank/zero-size past roughly `scrollY > 200–700px`, across
  fresh tabs, full-page-height viewport resizing, and JS-precise scroll
  targeting with waits in between, while `document.visibilityState` read
  `"hidden"` throughout (the pane not being fronted in the host UI).
  `getComputedStyle` (non-geometric) and `find`/`get_page_text` (DOM/text,
  not pixels) stayed reliable the whole time and are the fallback verification
  method whenever this recurs — don't burn time re-troubleshooting screenshot
  capture itself if it's blank past a shallow scroll depth.
- `pnpm tsc --noEmit`: 0 errors. `pnpm lint`: 6 warnings (baseline,
  pre-existing in `src/checkout/`) — no new warnings introduced.

## Footer: ChannelSelect Removed from UI (Session 41)

`ChannelSelect` (the currency/channel `<select>` dropdown, Column 1, below
the tagline) removed from [Footer.tsx](src/ui/components/Footer.tsx) — a
pure frontend removal, no backend channel changes (the `uae-channel` /
default-channel setup is untouched).

- `ChannelSelect.tsx` itself was **only ever used in Footer.tsx** (confirmed
  via repo-wide grep) — the component file was **not deleted**, per
  instruction not to remove it without asking first. It's now dead code;
  flagging that removing the file too is a reasonable follow-up, but that's
  a separate decision.
- `ChannelsListDocument` (the GraphQL query that fed it) is **also used
  elsewhere** — `src/app/[locale]/[channel]/layout.tsx` — so only the
  import/usage in Footer.tsx was removed; the generated document and its
  other call site are untouched.
- `getFooterData()` simplified: no longer runs `Promise.all` fetching both
  the footer CMS menu and the channels list — now just awaits
  `MenuGetBySlugDocument` directly. The `SALEOR_APP_TOKEN`-gated
  channels-fetch branch is gone entirely (that env var isn't referenced
  anywhere else in this file).
- Column 1 now ends cleanly after the tagline `<p>` — verified via direct
  DOM inspection (`col1Children` = `[DIV, P]`, no `<select>` present, no
  leftover wrapper/empty gap) and via two independent fresh `curl` fetches
  of the raw SSR'd HTML (before and after a hard reload) showing zero
  `<select>` tags.
- **Tooling note**: the Browser pane's `read_console_messages` returned the
  same cached `ReferenceError: channels is not defined` /
  `ChannelsListDocument is not defined` entries (identical error digest)
  across multiple fresh navigations and a hard reload — a stale/cached
  artifact of that tool in this session, not a real error. Ruled out via
  direct `curl` of the server-rendered HTML (twice) and a full grep of the
  source file showing zero remaining references to either symbol. Worth
  remembering: don't trust `read_console_messages` alone if its output
  isn't changing across reloads — cross-check with a raw `curl` of the
  page or a fresh browser tab.
- `pnpm tsc --noEmit`: 0 errors. `pnpm lint`: 6 warnings (baseline,
  pre-existing in `src/checkout/`) — no new warnings introduced.

## Production Deployment Gap Found + ChannelSelect.tsx Deleted (Session 42)

- **`ChannelSelect.tsx` deleted** (was dead code after Session 41 removed
  its only usage from `Footer.tsx`) — reconfirmed zero remaining references
  repo-wide via grep before deleting. `pnpm tsc --noEmit`: 0 errors,
  `pnpm lint`: 6 warnings (baseline, `src/checkout/` only) — clean after
  the deletion.
- **Important finding, blocks the production half of the "Become a
  Supplier" menu-item work (Sessions 40-41) from proceeding as planned**:
  production (`178.104.165.44`, `tawasiplus.com`) is running deployed
  commit `b0b94b5` ("Merge pull request #19 from
  ibrahimDataEng/feature/country-of-origin-session-37"), while every
  Footer.tsx change from Sessions 40-41 (Legal column reorder + Refund
  Policy, the new tagline, the `toInternalHref()` fix, the ChannelSelect
  removal) existed **only as uncommitted local working-tree changes** on
  branch `feature/country-of-origin-session-37` — never committed, never
  pushed, and therefore nowhere near production. Confirmed directly against
  the live site (`curl https://tawasiplus.com/en/uae-channel/`): the Legal
  column still shows the old hardcoded "Become a Supplier" entry (no
  "Refund Policy"), and the tagline is still the old short one. Production
  Postgres `MENU_page/footer` structure was confirmed unchanged (Green
  Line → About, Contact us only — no third child yet), as expected.
  **Creating the CMS "Become a Supplier" menu item on production before
  this code deploys would produce a broken, duplicated link** — production's
  currently-running `Footer.tsx` has no `toInternalHref()` to strip
  `https://tawasiplus.com/pages/become-supplier` down to a locale-prefixed
  path, and its old `legalLinks` array still separately hardcodes a
  "Become a Supplier" entry too. **Did not create anything on production
  this session** — stopped and flagged this instead. The production
  `menuItemCreate`/`menuItemTranslate` steps (with
  `url: "https://tawasiplus.com/pages/become-supplier"`) remain ready to
  run the moment this code is actually deployed there.
- All accumulated Footer.tsx work (Sessions 40-41) plus this session's
  `ChannelSelect.tsx` deletion were committed together on a new branch,
  `feature/footer-updates-session-42` — not pushed, per standing workflow
  (local commit only, user reviews and pushes manually).

**Follow-up, same session — gap closed, production now fully live**: the
user pushed `feature/footer-updates-session-42` and merged it to `main` via
PR #20 (`ba53194`). Deployed to production: `git pull` had already landed
the commit on the server (confirmed via `git log`), but the running
`saleor-storefront` container was still 44 hours old and serving the
pre-merge build — `docker compose -f docker-compose.yml -f
docker-compose.server.yml build --no-cache saleor-storefront` +
`up -d --force-recreate saleor-storefront` (both run via SSH, the first
initially blocked by the auto-mode permission classifier as a
production-affecting action — re-run after explicit user approval) rebuilt
and restarted it. Verified against the live container directly (bypassing
any Cloudflare cache) that the footer's Legal column now shows Refund
Policy and no "Become a Supplier", and the new tagline renders — a
separate, unrelated "Become a Supplier" string on the page turned out to
come from `MobileLinksMenu.tsx`'s own hardcoded hamburger-popup link (out
of scope for this work, never touched), not a leftover in the footer.

- Then created the production `"Become a Supplier"` menu item (same
  process as local: `menuItemCreate` with
  `url: "https://tawasiplus.com/pages/become-supplier"`, parented under the
  same `Green Line` item, id `TWVudUl0ZW06MjQ3` — coincidentally the same
  ID as local's, since both menus had the same 2 pre-existing children) and
  its AR translation via `menuItemTranslate`. This time the Arabic payload
  was sent as a local UTF-8 file `scp`'d to the server first, then posted
  with `curl --data-binary @/tmp/....json` from an SSH shell on the box
  itself — no corruption, confirmed correct on the first attempt (unlike
  the local-DB corruption incident in Session 41, which happened via a
  Windows Git Bash `-d` inline string argument).
- Verified fully live on both locales:
  `https://tawasiplus.com/en/uae-channel/` Explore column → "Become a
  Supplier" → `/en/uae-channel/pages/become-supplier` (renders); the `/ar/`
  equivalent → "كن مورّداً لنا" (real Arabic, confirmed via `find`, not "?"
  characters) → `/ar/uae-channel/pages/become-supplier` (renders). All
  three footer tasks (Legal column, Explore menu item, tagline) are now
  live on production in both locales, matching local dev exactly.

## Trending Products — proton_analytics Integration (Session 44)

Wires the storefront to `proton_analytics` (separate repo, internal-only
microservice; see `saleor_platform/docker-compose.yml` for how it runs).
Write path records product views; read path renders a "Trending Now"
homepage section. No new dependencies.

- **`ANALYTICS_SERVICE_URL`** added to `.env.example`
  (`http://localhost:4000` local, `http://proton_analytics:4000` in Docker).
  **Deliberately NOT `NEXT_PUBLIC_`** — proton_analytics has no auth and must
  never be reachable from a browser. Server-side only.
- **Write path**: new Route Handler
  `src/app/api/analytics/track-view/route.ts` (POST). Validates
  `{productId: string}` (400 otherwise), forwards to the service with
  `AbortSignal.timeout(2000)`, and **always answers 202** — the forward is
  wrapped in try/catch and only `console.error`s, so an analytics outage can
  never surface in the browser. It exists so the browser only ever talks to a
  same-origin Next route, never to proton_analytics directly.
- **PDP trigger**: `src/ui/components/pdp/ProductInfo.tsx` gained a **second,
  independent** `useEffect` keyed on `[product.id]`, adjacent to the existing
  `recordProductView` effect. Kept separate on purpose — `recordProductView`
  is the logged-in-only "recently viewed" feature (`isLoggedIn` guard),
  whereas trending must count **every** visitor, so the two cannot share a
  gate. Fire-and-forget with `.catch(() => {})`.
  Note: React StrictMode double-invokes effects in dev, so each dev page view
  registers as 2. Production does not.
- **Read path**: `src/graphql/ProductsByIds.graphql` (new, additive) —
  `products(filter: { ids }, first, channel)` spreading the existing
  `...ProductListItem` fragment, modelled directly on `ProductsBySlugs.graphql`.
  **Placed at `src/graphql/` root, not `src/graphql/queries/`** — all 23
  existing queries live at the root; only `fragments/` and `mutations/`
  subdirectories exist. `src/gql/` is gitignored (regenerated by `prebuild`).
- **`src/ui/components/home/TrendingSection.tsx`** (Server Component) —
  fetches `/trending?limit=8` with a 2s timeout and `next: {revalidate: 300}`
  (matches the service's own 10-min aggregation cycle), resolves ids via
  Saleor, then **explicitly re-sorts** the Saleor result back into the
  analytics score order via a `Map` lookup — `filter: { ids }` gives **no
  ordering guarantee**, and showing the top-scoring product first is the
  entire point. Renders `null` on any failure (service down, timeout, bad
  payload) or when fewer than 4 products resolve — a sparse "trending" row
  looks worse than none on a newly launched store. Reuses `ProductList`
  (hence `ProductElement`), no duplicated card markup. Exports
  `TrendingSectionSkeleton` for the `<Suspense>` fallback.
- **Robustness fix found during testing**: Saleor rejects the **entire**
  `filter: { ids }` query with `"Invalid ID specified."` if even one array
  entry isn't a valid global ID. A single junk id from the analytics service
  would therefore throw out of the Server Component, past `<Suspense>`, to the
  error boundary — taking the homepage down over a decorative section. The
  Saleor call is now wrapped in its own try/catch returning `null`. Do not
  remove this guard.
- Mounted in `(main)/page.tsx` between `FeaturedProductsSection` and
  `CategoriesSection`, wrapped in `<Suspense>`.
- i18n: `home.trendingNow` added to `en.json` + `ar.json`
  ("Trending Now" / "الأكثر رواجاً الآن").

### Local environment problems hit while testing (NOT app bugs)

Three separate pre-existing environment failures blocked testing; recorded so
the next session doesn't re-diagnose them:

1. ~~`SALEOR_APP_TOKEN` in `.env` no longer authenticates~~ — **disproven by a
   follow-up read-only audit** (2026-09-04/05, beads front_store-k5h, closed).
   The token is valid and authenticates fine — verified live returning
   `default-channel`/`uae-channel` — and the app holds 10 permissions
   including `MANAGE_CHANNELS`, not the narrow scope originally assumed. The
   `PermissionDenied`/500s below were a symptom of point 2 (a broken
   `localhost:8000` path), not a token/auth problem. **Do not regenerate the
   token to "fix" this.**
2. **Port 8000 has three listeners** — Docker (`0.0.0.0`), VS Code's auto
   port-forward (`127.0.0.1`), and `wslrelay` (`[::1]`). Whichever one
   `localhost` resolves to on a given run decides success/failure, and
   **which path is broken flips between sessions** as Docker restarts and VS
   Code's forwarder reconnects — Session 44 saw `::1` broken and `127.0.0.1`
   working; the Session 44-follow-up audit saw the opposite (`127.0.0.1`
   timing out via VS Code's forward, `::1` working). **Do not chase this with
   `NODE_OPTIONS=--dns-result-order=ipv4first`** — forcing IPv4 pins you to
   whichever of the two host-side forwards happens to be broken that day; it
   is not a stable fix and has already caused a false "token is dead"
   diagnosis once. The actual fix is to stop VS Code from auto-forwarding
   port 8000 at all (Ports panel → _Stop Forwarding Port_, or
   `"remote.autoForwardPorts": false`) so only Docker's real listener and the
   `wslrelay` path to it remain — both reach the same live Saleor instance.
   If a page 500s with `PermissionDenied`/`ECONNREFUSED`/timeout touching
   Saleor, check `netstat -ano | grep :8000` for a stray forwarder before
   suspecting the token or the app. Do **not** just switch the URL to
   `127.0.0.1` — the compose `api` service overrides
   `ALLOWED_HOSTS=localhost,api`, so a `127.0.0.1` Host header gets Django's
   `DisallowedHost`. Port 4000 has the same relay-shadow risk.
3. **The E394 `not-found.tsx doesn't have a root layout` loop recurs
   aggressively**, preceded by `.next/cache/webpack/*.pack.gz` rename-ENOENT
   warnings (as already documented under "Known issues"). Deleting `.next`
   _while the dev server is starting_ reliably re-triggers it. Kill every
   `front_store` node process first, delete `.next`, start, then leave it
   alone for ~45s before the first request.

## Login Lockout Duration Reduced + Clearer Error Message (Session 45)

Diagnostic first (read-only pass) corrected an earlier misdiagnosis: a prior
session read a Redis key's TTL (`login:fail:ip:<ip>`, ~6785s) and concluded
login lockouts lasted ~1.9 hours. That key is actually just the **failed-attempt
counter** (flat `ATTEMPT_COUNTER_EXPIRE_TIME = 7200`s bookkeeping window, not
a block). The real block key is a separate one, `login:block:ip:<ip>`, whose
TTL is the actual computed exponential-backoff delay, capped at `MAX_DELAY`
— **1 hour**, not 1.9, and only reached after a long run of consecutive
failures (the delay is `2^(attempts-1)` seconds per attempt against the same
account). Still worth softening per this session's request, just correcting
the number for the record.

- **Mechanism**: Saleor's own built-in `authenticate_with_throttling()` in
  `saleor/account/throttling.py` (core Saleor, not django-axes, not a
  plugin, not previously patched by this project) — called from
  `saleor/graphql/account/mutations/authentication/create_token.py`. The
  three relevant constants (`MIN_DELAY=1`, `MAX_DELAY`, `ATTEMPT_COUNTER_EXPIRE_TIME=7200`)
  are hardcoded Python module constants — no env var controls them.
- **Patch**: `saleor_platform/custom_patches/throttling.py` — a byte-for-byte
  copy of the original except `MAX_DELAY = 3600` → `MAX_DELAY = 1200` (20
  min). `MIN_DELAY` and the exponential `2^(attempts-1)` backoff formula are
  completely untouched — light mistyping still gets the same 1s/2s/4s...
  progressive delay; only the ceiling for sustained repeated failures is
  lower. Added to `saleor_platform/Dockerfile` as a third overlay `COPY`,
  same pattern as the existing Arabic-search patch
  (`custom_patches/product_helpers.py`) and the branded email templates —
  see the Dockerfile's own comments for all three.
  **Note**: `saleor_platform/` is not a git repository (confirmed — `git
diff` there fails with "not a git repository"), so this patch and the
  Dockerfile change aren't tracked by version control the way the
  storefront's own changes are; only the `front_store` repo commit covers
  the frontend half of this session's work.
- **Local-only so far, deliberately**: image rebuilt (`docker compose build
api`) and `api`+`worker` recreated together (`up -d --force-recreate api
worker` — both recreated together since they share the same image, per the
  project's version-parity rule) on the local dev stack only. **Not deployed
  to production this session** — a separate deliberate production
  deployment step is planned for later, same as any other backend patch.
- **Frontend error handling** — traced end-to-end before changing anything:
  Saleor returns GraphQL error code `LOGIN_ATTEMPT_DELAYED` for this case
  (confirmed empirically), but
  [route.ts](src/app/api/auth/login/route.ts)'s `ERROR_MAP` only recognized
  `INVALID_CREDENTIALS`/`ACCOUNT_NOT_CONFIRMED`/`INACTIVE`, so it fell
  through to `"unknown"` → `auth.errors.unknown` ("Something went wrong.
  Please try again.") in [LoginForm.tsx](src/ui/components/auth/LoginForm.tsx).
  Fixed: `LOGIN_ATTEMPT_DELAYED` added to `ERROR_MAP`; new
  `auth.errors.LOGIN_ATTEMPT_DELAYED` key added to both `en.json`/`ar.json`
  (no existing key fit — checked first). `LoginForm.tsx` now tracks the raw
  error code separately from the display string (`errorCode` state,
  alongside the existing `error` string state) so it can tell this specific
  case apart from a plain wrong password — when active, the existing
  "Forgot password?" affordance (same `onForgotPassword` prop, same
  `t("forgotPassword")` key — no new component) is additionally rendered
  **inside** the red error banner itself, bold and underlined, without
  hiding or duplicating away the original small persistent one elsewhere
  in the form. No live countdown timer (out of scope, per session request)
  — just the static 20-minute text.
- **Verified**:
  - Deliberately triggered the lockout locally by seeding the IP-level
    Redis counter (`login:fail:ip:172.20.0.1`) to 99 via `redis-cli SET`
    (a legitimate boundary-condition test shortcut — reaching 100 organically
    would have meant replaying the full exponential backoff in real time)
    then firing one real failed login attempt through the actual Saleor
    code path to push it to 100 and let the app's own `override_block` set
    the real block key.
  - Redis TTL check on `login:block:ip:<ip>` immediately after: **1191s**
    (~1200 - a few elapsed seconds) — confirms the 20-minute cap is
    genuinely active, not just present in source.
  - Live UI check, both locales, real browser: EN shows "Too many failed
    login attempts. Please wait 20 minutes before trying again, or reset
    your password." with the bold in-banner "Forgot password?" link; AR
    shows "تجاوزت عدد محاولات تسجيل الدخول المسموح بها..." with the
    matching Arabic link, correct RTL layout, both confirmed via
    screenshot.
  - Normal (pre-lockout) wrong-password case confirmed unchanged: the
    single request that pushed the counter from 99→100 itself still
    returned the standard `INVALID_CREDENTIALS` response (not the new
    message) — the new behavior only activates once the block is actually
    set, exactly as scoped. Not re-verified through the live UI a second
    time on top of that, since doing so requires waiting out the current
    test lockout; the `ERROR_MAP`/i18n diff also confirms the three
    pre-existing codes were left untouched.
- `pnpm tsc --noEmit`: 0 errors. `pnpm lint`: 6 warnings (baseline,
  pre-existing in `src/checkout/`) — no new warnings introduced.

## New dependencies

- framer-motion@12.38.0 — card entrance, pill tap, add-to-cart AnimatePresence
  swap, shake on error, empty-state floating icon, not-found/error SVG
  animations (added session 16)

## External services

- flagcdn.com — country flag images in CountrySection (no API key, free, https:\*\* wildcard covers it)
- images.unsplash.com — BrandStorySection nuts background (replace with own photo when ready)

## Checkout UX Polish (Session 25)

- **Form validation**: `goNext()` in CheckoutForm.tsx runs `document.querySelector("form")?.checkValidity()` before advancing — HTML5 native validation (no hooks/state touched); reports validity inline if form is invalid
- **Inline error banner**: `src/checkout/components/CheckoutErrorBanner.tsx` — intercepts toast errors via `toast.onChange` in a useEffect; renders red alert with dismiss + WhatsApp help link; auto-clears on step change
- **ToastContainer**: `src/checkout/Root.tsx` — now `position="bottom-center"`, `autoClose={5000}`, `hideProgressBar={false}`, `style={{ fontSize: "14px" }}` (spread after `alertsContainerProps`)
- **CheckoutStepper**: added `py-6 border-b border-neutral-100` for breathing room
- **Checkout page card**: form content wrapped in `bg-white shadow-sm border border-neutral-100/80 rounded-xl p-4 md:p-8`
- **Logo swap**: checkout header now uses `<Image src="/logo.png" width={140} height={32} />` (NOT Logo.tsx — that uses LinkWithChannel which generates channel URLs incompatible with checkout)
- **Contact spacing**: SignInFormContainer "already have an account?" row now has `border-t border-neutral-100 pt-4 mt-4`
- **CheckoutDiscovery**: hidden via `<div className="hidden">` wrapper in Checkout.tsx (component too complex to safely modify)
- **checkoutId persistence**: URL-param only (`?checkout=CHECKOUT_ID`) — NO localStorage/sessionStorage involved. "Previous order data" is Saleor server behavior, not client storage. No code fix needed.

## Checkout Wizard (Session 24)

- 3-step wizard: Contact → Shipping → Review & Pay
- Step controller: `src/checkout/sections/CheckoutForm/CheckoutForm.tsx` (useState for currentStep + direction, no hook changes)
- Stepper UI: `src/checkout/components/CheckoutStepper.tsx` (pure CSS transitions, step labels from checkoutMessages.ts `wizard` key)
- Step transition: framer-motion AnimatePresence mode="wait" + motion.div slide left/right based on direction
- CollapseSection.tsx simplified to passthrough wrapper
- Trust components: `src/ui/components/checkout/CheckoutTrustBar.tsx` (server, i18n "checkout" namespace) + `CheckoutWhatsApp.tsx` (client, floating WhatsApp button)
- Brand color `#2d6a4f` applied throughout all checkout primitives (Button, inputs, SelectBox, icons, AppConfigProvider)
- All SVG icons updated: `#394052` → `#2d6a4f`, `#B65757` → `#dc2626`, `#2C9B2A` → `#2d6a4f`
- Wizard strings added to `checkoutMessages.ts` under `wizard` key (EN + AR)
- `"checkout"` namespace added to `en.json` + `ar.json`: securePay, freeReturns, fastDelivery

Session 26 additions (all in `src/ui/components/checkout/`):

- `CheckoutCountdown.tsx` — "use client"; cutoff 17:00 UAE (UTC+4 = 13:00 UTC); setInterval 1s; mounted flag prevents hydration mismatch; hidden at/after cutoff (returns null); bilingual hardcoded text; timer digits with label rows
- `CheckoutTrustBar.tsx` — restyled: bg-[#f0f7f4] border-[#d4e8de], text-[#2d6a4f] font-medium; reordered to Shield→Truck→Arrow; icon size 16px; gap-4/gap-12
- `CheckoutShippingProgress.tsx` — server component; props: subtotal, threshold (default 100 AED), locale; gradient progress bar; checkmark badge when free; bilingual labels
- `CheckoutPaymentIcons.tsx` — server component; Visa/MC (nested clipPath SVG)/ApplePay/Amex/Cash; SSL lock note; bilingual title + cash label
- checkout/page.tsx: CheckoutCountdown between header and TrustBar; ShippingProgress + PaymentIcons below RootWrapper (ml-auto max-w-[420px]); fetches subtotal via Checkout.find(searchParams.checkout, locale)

- `CheckoutFooter.tsx` — server component; Visa + Mastercard + Cash on Delivery icons; SSL 256-bit note; rendered at very bottom of checkout/page.tsx after CheckoutWhatsApp

Session 27 updates:

- `CheckoutCountdown.tsx` — window logic: 13:00–21:59 UAE → "tomorrow", countdown to 22:00 UAE (18:00 UTC); 22:00–12:59 UAE → "day after tomorrow", countdown to 13:00 UAE (09:00 UTC); bilingual delivery label in timer bar; abbreviated mobile text updated
  **Superseded by Session 39** — see "Delivery Countdown Cutoff Fix (Session
  39)" below; the 13:00/22:00 boundaries described here are no longer what
  the code does, kept only for history.
- `CheckoutShippingProgress.tsx` — threshold raised from 100 → 200 AED; text updated: "orders over د.إ 200"; free message updated; scale label still uses `{threshold}` variable
- checkout/page.tsx — header redesigned: cart←logo(center)→help layout; Back-to-cart link uses `checkoutChannel` derived from `checkoutData?.channel?.slug`; ShippingProgress placed above RootWrapper (desktop, lg:flex justify-end w-[400px]) + inside lg:hidden wrapper below form (mobile); also fetches `checkoutChannel` from checkout data
- Footer — language switcher (globe icon + alternate locale link) added to bottom bar; payment icons row (Visa/MC/ApplePay/Amex/Cash) added centered; legal links (Terms of Use + Privacy Notice) via LinkWithChannel; bilingual copyright updated to "Tawasi Plus"; `Link` import added

**NEVER touch:**

- `src/checkout/hooks/` (any file)
- `src/checkout/state/` (any file)
- `src/checkout/graphql/` (any file)
- `src/checkout/sections/PaymentSection/AdyenDropIn/`
- `src/checkout/sections/PaymentSection/StripeElements/`

**CSS className changes and UI-only component rewrites in src/checkout/ are permitted with explicit session approval only.**

## Deployment & Environment Workflow (Session 27)

- **Docker Compose split:**
  - `docker-compose.yml` — shared base (build args, service definition)
  - `docker-compose.local.yml` — local dev override (open port 3000)
  - `docker-compose.server.yml` — production override (127.0.0.1 binding, explicit env_file)
  - Local run: `docker compose -f docker-compose.yml -f docker-compose.local.yml up -d`
  - Server run: `docker compose -f docker-compose.yml -f docker-compose.server.yml up -d`
- **Golden rule**: ALL code changes (including Dockerfile, next.config.ts, docker-compose.yml)
  are made on LOCAL only, committed, pushed to GitHub, then pulled on the server. The server
  NEVER pushes to GitHub and is never the source of truth for code — it only pulls and runs.
- **Server git branch must always be `main`** — never a feature branch. Previously misconfigured
  and caused a cascade of merge conflicts during Session 26/27; now fixed.
- `.gitattributes` added (`* text=auto eol=lf`) to prevent CRLF/LF line-ending drift between
  Windows local dev and the Linux server.
- `next.config.ts` requires `output: "standalone"` for Docker builds; the Dockerfile's runner
  stage requires explicit `COPY` of `public/` and `node_modules/nodemailer` because Next.js
  standalone output doesn't auto-trace them. Losing these two lines causes a Docker build
  failure (`'/app/.next/standalone': not found` or similar).
- **Rebrand note**: storefront's consumer-facing brand is "Tawasi Plus" (not "Green Line" or
  "PROTON" — those were legacy/incorrect labels, fixed in Session 26).
- **Hotfix branch convention**: production-breaking bugs get their own `hotfix/<short-name>`
  branch, merged to main directly — not bundled into a long-running feature/session branch.

## Session 26-30: Backend GitHub Setup, Rebrand, Bug Fixes, Dark Mode, About Page, DB Cleanup

Docker Compose split, the golden local→GitHub→server deployment rule, `.gitattributes`,
and the `output: "standalone"`/Dockerfile `COPY` requirements are already documented above
under "Deployment & Environment Workflow (Session 27)" — not repeated here, only the
additional facts from this session follow.

- **Backend (`saleor_platform`) now on GitHub** as `proton_platform` — git-initialized
  **from the server**, not local (the server had the real/current patches; local was stale).
  Patches (Arabic search fix, branded email templates) are baked into the backend
  `Dockerfile` via `COPY` from `custom_patches/` and `custom_email_templates/` — this
  replaces the old workflow of `docker cp`-ing patches into a running container, which
  never survived a rebuild. Secrets (`.env`, `backend.env`, `common.env`,
  `private_key.pem`) are gitignored; `.example` versions are committed instead.
- **Storefront repo renamed** to `proton_storefront` on GitHub (previously
  `FrontEnd-Green-Line`) — the old URL auto-redirects, but the git remote should point at
  the new URL directly rather than relying on the redirect.
- **CRLF/LF drift specifics**: the server-branch-misconfiguration incident referenced above
  (Session 26/27) cascaded into merge conflicts across ~35 files, compounded specifically
  by Windows/Linux line-ending drift — this is what `.gitattributes` (`* text=auto eol=lf`)
  was added to prevent going forward.
- **`removeConsole` is a deliberate permanent choice, not a pending revert**: hardcoded
  `false` in `next.config.ts` (kept for production debugging visibility) — if an earlier
  note anywhere implied this needed reverting to `process.env.NODE_ENV === "production"`,
  that's superseded; the hardcoded `false` is the intended end state.
- **Rebrand detail beyond the existing note**: Green Line Group remains the legal business
  entity (its real contact info is unchanged) and appears as a small secondary monochrome
  logo mark next to the main Tawasi Plus logo in the footer (`public/greenline-mark.png`).
  "PROTON" is the dev agency's own internal name and must never appear in any
  storefront-facing text.
- **Critical bug fixed — cart page crash**: `findOrCreate()` in `src/lib/checkout.ts` used
  to write a cookie internally via `saveIdToCookie()`, which only works inside a Server
  Action/Route Handler. `cart/page.tsx` is a plain Server Component render, so a first-time
  visitor with no checkout cookie crashed with "Cookies can only be modified in a Server
  Action or Route Handler." Fixed: `findOrCreate()` is now pure GraphQL I/O with no cookie
  side effect; `cart/page.tsx` uses the existing read-only `find()` helper instead (same
  pattern as `CartNavItem.tsx`). Server Actions in `cart/actions.ts` already call
  `saveIdToCookie()` explicitly, so cart mutations were never affected.
- **Dark/light mode toggle** added — `ThemeToggle.tsx` (Footer + mobile drawer header),
  `ThemeInitializer.tsx`, `src/lib/theme.ts`. Sun/moon icon via framer-motion,
  localStorage-persisted; light mode is always the default for first-time visitors (no
  `prefers-color-scheme` inference). Theme persists across locale (en/ar) switches via
  `ThemeInitializer` keyed on pathname, since client-side locale navigation doesn't trigger
  a fresh document load (the FOUC-prevention inline script alone isn't sufficient for that
  case). New theme-invariant `--color-text-footer` token (`#FAF7F2`, fixed in both
  light/dark) — do **not** use `--color-text-inverse` for footer content, it flips
  per-theme and becomes illegible against the always-dark footer.
- **Footer cleanup**: removed X/LinkedIn social links, added WhatsApp
  (`wa.me/971558711442`), removed a duplicate "Contact Us" entry from the Legal column (the
  Explore column's CMS-menu-driven links are managed in the Saleor Dashboard's "footer"
  menu, not in code). Logo sizing bug fixed across all `Logo.tsx` usages (Header, Footer,
  MobileMenu, MobileDrawer).
- **Custom About page** (`src/ui/components/about/AboutPageClient.tsx`,
  `src/lib/parseAboutContent.ts`) — content stays CMS-driven (Saleor Page, slug `about`,
  editable from the Dashboard) but is parsed from Editor.js JSON into 4 fixed-position
  sections (About/Mission/Objectives/Values — grouped by header-block order; "· Title:
  Description" bullet paragraphs split into card title/description pairs), rendered to
  match `WholesalePageClient.tsx`'s visual style. Falls back to the generic prose renderer
  if content doesn't match the expected structure (session 31 later confirmed this page
  live in production — see the "Known issues" note above). Local and production Saleor
  databases are completely separate — CMS content must be manually re-entered in both
  Dashboards.
- **Database cleanup (Aug 2026)**: both local and production Saleor DBs had all test/seed
  orders deleted (22 orders total across default-channel/channel-pln/uae-channel) and the
  `channel-pln` test channel removed. Required deleting legacy `payment.Transaction` rows
  before `Payment` due to a `PROTECT` FK — Postgres itself has `NO_ACTION` on Order's FKs,
  so Saleor's cascade logic lives entirely in the Django ORM; raw SQL deletion is never
  safe here, only Django-shell/management-command deletion respects the cascade chain
  correctly. Full `pg_dump` backups were taken before each deletion. `uae-channel` (the
  real active channel) and all products/categories/users were left untouched.

## Rules (ALWAYS follow)

- src/checkout/ — NEVER touch hooks/, state/, graphql/, AdyenDropIn/, StripeElements/. CSS className changes and UI-only component rewrites are permitted with explicit session approval only.
- DO NOT touch src/gql/ or src/graphql/
- DO NOT hardcode product/category data
- Use LinkWithChannel (@/ui/atoms/LinkWithChannel) for ALL internal links
- Use Container for layout, Button for CTAs
- All new components: Server Components by default
- Mobile-first, breakpoints: 375 / 768 / 1280
- No new dependencies without asking
- Work on feature branches, commit after each component
- Run pnpm tsc --noEmit and pnpm lint after every step

## Issue tracker

beads (bd) — issues live in .beads/issues.jsonl
Run `bd list` or `bd ready` to see current state.
No need to duplicate issue details here.
