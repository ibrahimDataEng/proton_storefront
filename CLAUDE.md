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
- GraphQL source: src/graphql/ (19 .graphql files)
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
- pages/[slug]/page.tsx still has a stray console.log (line ~37)
  noticed during Session 5 refactor; not removed since out of scope
- Promo code UI exists (OrderSummary) but mutation not wired —
  checkoutAddPromoCode not in src/graphql/ (field shows disabled state)
- Quantity stepper: CheckoutLinesUpdate added in session 14 via codegen
- "Add to cart" on recommendations navigates to product page —
  defaultVariant.id is not in ProductListItem fragment
- Variants data: UI ready but variants not yet configured in Saleor backend

## Components redesigned

- Header: HeaderWrapper (client) + Header (server),
  hide-on-scroll past 80px, reappears on scroll-up,
  fixed positioning, surface-base/80 backdrop-blur
- Footer: redesigned with 4-col grid (Brand / Explore / Legal / Social),
  brand-primary dark bg, social via Lucide icons, tokens applied,
  CMS menu logic + ChannelSelect + Skeleton preserved
- Nav: NavLink uses brand-primary (active) / content-secondary (default),
  console.log + revalidate:1 fixed in NavLinks.tsx
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
- /account — dashboard + account info + change password (session 12)
- /cart — full redesign, two-column layout, recommendations,
  saved for later, quantity stepper, order summary (session 14)
- /products — filters + variant display + 4-col grid (sessions 15/16)

## Health status (post-Session 16)

- TS errors: 0 (verified via `pnpm tsc --noEmit`)
- Lint warnings: 7 (baseline — 6 in src/checkout/, 1 in Logo.tsx)
- Working tree: clean on feature/ui-redesign-session-16
- framer-motion@12.38.0 added as dependency (session 16)

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
  quantityUpdate, increase, decrease
- `products` — title, count, addToCart, selectVariant, outOfStock, filters,
  sortBy, newest, priceLowHigh, priceHighLow, bestSelling, biggestDiscount,
  allCategories, priceRange, minPrice, maxPrice, apply, inStockOnly,
  clearFilters, noResults, clearAndReset, added
- `auth` — login, register, logout, email, password, confirmPassword, firstName,
  lastName, forgotPassword, sendResetLink, resetEmailSent, switchToRegister,
  switchToLogin, confirmEmailRequired, backToLogin, resetPassword, newPassword,
  setPassword, passwordUpdated, invalidResetLink, expiredResetLink,
  requestNewLink, account, accountInfo, changePassword, currentPassword,
  confirmNewPassword, passwordChanged, signOut, myAccount, errors.\*
- `home`, `error`, `button`, `welcome`, `goodbye` — misc

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

## New dependencies

- framer-motion@12.38.0 — card entrance, pill tap, add-to-cart AnimatePresence
  swap, shake on error, empty-state floating icon, not-found/error SVG
  animations (added session 16)

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
