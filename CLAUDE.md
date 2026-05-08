# CLAUDE.md — Storefront Project Memory

## Stack

- Next.js 15.2.4 (App Router), React 19, TypeScript 5.3.3
- Tailwind 3.4.0 (extended with custom tokens), pnpm 9.6.0
- next-intl 4.3.9 (locales: en, ar — both primary)
- GraphQL via executeGraphQL (src/lib/graphql.ts) + codegen (src/gql/)
- IBM Plex Sans + IBM Plex Sans Arabic (next/font/google)

## Architecture

- Storefront: src/app/ (App Router, /[locale]/[channel]/...)
- Checkout sub-app: src/checkout/ — SEPARATE, DO NOT TOUCH
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

- 7 lint warnings: 6 in src/checkout/ + 1 in Logo.tsx
  (next/image suggestion — Logo is raw <img>)
- /pages/about may not exist in Saleor backend
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
- NavLinks (Session 23): replaced CMS-driven items with 4 fixed items:
  Home → /, Shop → MegaMenu + /products, Wholesale → /pages/wholesale,
  Contact → /pages/contact-us; fetches CategoriesWithChildren (not navbar menu);
  accepts mobile prop — passes to ShopNavItem for accordion vs hover mode
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
  useClickOutside hook; clear-all button
- ProductElement (Sessions 15-16): "use client", selectedVariantId state
  (first variant pre-selected), interactive pills with whileTap, whileInView
  entrance animation, exact per-variant price, struck-through undiscounted
  price when discounted, OOS badge; 4-col grid (2/3/4 mobile/tablet/desktop)
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
- ShopNavItem / MegaMenu (Session 23): src/ui/components/nav/ShopNavItem.tsx —
  "use client"; dual-mode: desktop (hover panel, fixed full-width, left category
  column + right subcategory grid 3-4 cols, scaleY animation) / mobile (accordion
  in existing MobileMenu, AnimatePresence height transition); RTL-aware chevrons +
  arrow directions; useClickOutside for desktop close-on-outside-click;
  categories fetched via CategoriesWithChildren GraphQL query (level=0, 8 root
  cats, 10 children each); passes through NavLinks server component
- ContactPageClient (Session 22): src/ui/components/contact/ContactPageClient.tsx —
  "use client"; two-column layout (info cards + form); 4 info cards (email/phone/address/hours)
  with spring lift + brand-primary accent bar on hover; form (name/email/subject/message)
  with inline validation; submit AnimatePresence: idle→sending→sent (green) auto-reset 5s;
  useInView scroll-triggered stagger; full RTL (dir="auto", mirrored accent bar);
  rendered via pages/[slug]/page.tsx when slug === "contact-us" (NOT a standalone route)

## Pages completed

- / (home) — 4 sections (sessions 2/3)
- /categories — index page built (session 13)
- /categories/[slug] — 404 bug fixed, empty state animated (session 13/16)
- /search — theme applied (session 6), no-results EmptyState (session 16)
- /pages/[slug] — CMS page, design tokens applied (session 11)
- /collections/[slug] — design tokens applied (session 11)
- /login — fallback standalone page (session 8)
- /register — fallback standalone page (session 8)
- /reset-password — set password from email token (session 10)
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

## Health status (post-Session 23)

- TS errors: 0 (verified via `pnpm tsc --noEmit`)
- Lint warnings: 7 (baseline — 6 in src/checkout/, 1 in Logo.tsx)
- Brand-primary updated: #2D3B2E → #2D6A4F (richer, more vibrant green); dark mode #4A5D4A → #4D8C6B
- Working tree: clean on feature/ui-redesign-session-23
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
- `nav` — home, shop, wholesale, contact, viewAll, allCategories (session 23)
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

## New dependencies

- framer-motion@12.38.0 — card entrance, pill tap, add-to-cart AnimatePresence
  swap, shake on error, empty-state floating icon, not-found/error SVG
  animations (added session 16)

## External services

- flagcdn.com — country flag images in CountrySection (no API key, free, https:\*\* wildcard covers it)
- images.unsplash.com — BrandStorySection nuts background (replace with own photo when ready)

## Rules (ALWAYS follow)

- DO NOT touch src/checkout/ under any circumstances
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
