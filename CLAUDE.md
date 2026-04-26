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

## Known issues (pre-existing, not introduced by redesign)

- 7 lint warnings: 6 in src/checkout/ + 1 in Logo.tsx
  (next/image suggestion — Logo is raw <img>)
- /pages/about may not exist in Saleor backend
- CartNavItem badge, MobileMenu, UserMenu still use neutral-\* hardcoded
  colors — candidate for a future session
- pages/[slug]/page.tsx still has a stray console.log (line ~37)
  noticed during Session 5 refactor; not removed since out of scope

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

## Pages completed

- / (home) — 4 sections (sessions 2/3)
- /categories — index page built (session 6)
- /categories/[slug] — pre-existing, not yet themed
- /search — theme applied (session 6)
- /pages/[slug] — CMS page, not yet themed
- /collections/[slug] — pre-existing, not yet themed

## Health status (post-Session 7)

- TS errors: 0 (verified via `pnpm tsc --noEmit`)
- Lint warnings: 7 (baseline — 6 in src/checkout/, 1 in Logo.tsx)
- Working tree: clean on feature/ui-redesign-session-7

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
- `home`, `error`, `button`, `welcome`, `goodbye` — misc

## Search URL param

The search page uses `?query=` (NOT `?q=`). All new code that constructs
search URLs must use `query` as the param name.

## Session branches

- Session 2: feature/ui-redesign-session-2 ✓ (merged + deleted)
- Session 3: feature/ui-redesign-session-3 ✓ (merged + deleted)
- Session 4: feature/ui-redesign-session-4 ✓ (merged + deleted)
- Session 5: cleanup + merge ✓ (work landed via session-4 merge)
- Session 6: feature/ui-redesign-session-6 ✓ (open, awaiting review)
- Session 7: feature/ui-redesign-session-7 ✓ (open, awaiting review)

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
