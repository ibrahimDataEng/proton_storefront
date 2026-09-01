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

- **[P0, beads front_store-gfa]** `/login` and `/register` currently 500 for
  every visitor, both locales — discovered Session 34 while verifying the
  account-deletion feature (needed a working login to test Settings). Root
  cause: `(main)/login/page.tsx` and `(main)/register/page.tsx` are async
  Server Components (`cookies()`/`redirect()`/`getTranslations`) that render
  `<AuthFormWrapper mode="login" onModeChange={() => undefined} />` —
  `AuthFormWrapper` is a Client Component, and passing an inline function
  prop from a Server Component across the RSC boundary is invalid under
  Next.js 15 ("Event handlers cannot be passed to Client Component props").
  Confirmed reproducible from a fully cleared `.next` cache, so it isn't
  build-cache noise. `AuthModal.tsx`'s own use of `AuthFormWrapper` (passing
  `setAuthModalMode`) is unaffected — that's a client-to-client call. Fix is
  a one-line prop default (`onModeChange` optional, no-op internally) plus
  dropping the inline handler from both standalone pages; flagged as its own
  session rather than fixed inline here to keep the account-deletion branch
  scoped. This also explains why beads front_store-u40 ("Verify auth flow
  end-to-end", open since Session 8) never got closed — item 9 on that
  checklist is exactly this.
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
- /reset-password — set password from email token (session 10)
- /delete-account — reads `?token=`, calls `confirmAccountDeletion`; 4 states
  (missing token / not authenticated / expired-invalid / success →
  auto-logout + redirect home after 2s) (session 34)
- /[any-bad-url] — 404/error coverage complete: root (bilingual CSS-only), locale, (main) framer motion, products/[slug] (session 17)
- /account — full SPA dashboard (session 19):
  - AccountDashboard: client SPA, 4 sections (overview/orders/addresses/settings)
  - AccountSidebar: desktop sidebar + mobile horizontal tab bar, sign-out via useAuth
  - OverviewSection: 4 stat cards (total orders, last order, default address, member since), staggered framer entrance
  - OrdersSection: paginated (5+5), accordion line items, status badge color-coding, product thumbnails
  - AddressSection: CRUD grid (2-col), inline AnimatePresence slide form, inline delete confirm, set-default actions
  - SettingsSection: edit name (updateAccount action) + reuse ChangePasswordForm
  - account/actions.ts: updateAccount, createAddress, updateAddress, deleteAddress, setDefaultAddress
  - New GraphQL mutations: AccountUpdate, AccountAddressCreate, AccountAddressUpdate, AccountAddressDelete, AccountSetDefaultAddress
  - UserDetailsFragment extended: dateJoined + addresses array
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
    collapsible description
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
  filteredByCountry, clearCountry (session 21)
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
- `notFound` — title, subtitle, goHome, browse, checkUrl (session 17)
- `home` — header, description, aboutLink, contactLink,
  shopByCountry (session 21)
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
