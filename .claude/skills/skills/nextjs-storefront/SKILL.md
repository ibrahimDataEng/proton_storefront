---
name: nextjs-storefront
description: Frontend conventions for the Tawasi Plus Next.js 15 storefront — project structure, design tokens, component patterns, i18n/RTL rules, and local dev-server troubleshooting. ALWAYS consult this before building or editing any component under src/ui/ or src/app/, adding UI text or translations, working on layout/styling, debugging Arabic/RTL rendering issues, or when the local dev server behaves erratically (random 500s, stale Fast Refresh, hydration mismatches).
---

# Next.js Storefront Conventions (Tawasi Plus)

## Stack & structure

Next.js 15.2.4 (App Router only, no Pages Router) · React 19 · TypeScript 5.3.3 (strict, zero `any`) · Tailwind 3.4.0 · next-intl 4.3.9 · framer-motion 12.38.0 · pnpm 9.6.0. Routing: `src/app/[locale]/[channel]/(main)/...`. Components live in `src/ui/components/` (there is no `src/components/`). Atoms in `src/ui/atoms/`. Design tokens in `src/ui/theme/tokens.ts` + `globals.css` CSS variables + `tailwind.config.ts`.

## Hard rules (no exceptions)

- **No hardcoded hex colors, no `neutral-*` Tailwind classes.** Always `text-brand-primary`, `bg-surface-base`, etc. — tokens only.
- **Always use `LinkWithChannel`** (`@/ui/atoms/LinkWithChannel`) for internal links — it prepends `/{locale}/{channel}`. Never wrap a `Button` (renders `<button>`) inside `LinkWithChannel` — invalid HTML; instead apply `className` directly to `LinkWithChannel` for link-styled buttons.
- **Server Components by default.** Only add `"use client"` when you actually need interactivity, hooks, or browser APIs.
- **i18n: zero hardcoded strings**, English or Arabic. Every new UI string goes through `next-intl` (`useTranslations`), and every new key is added to **both** `en.json` and `ar.json` in the same change — a key added to only one locale file will silently fall back or show raw keys for the other.
- Menu items or any CMS-supplied `url` field that could resolve to this site's own domain must be passed through a hostname-check helper before handing it to `LinkWithChannel` (see `toInternalHref()` pattern in `Footer.tsx`) — a raw absolute URL like `https://tawasiplus.com/pages/x` skips the automatic locale/channel prefixing and produces a broken link. This is the same failure class as the bare-path `redirectUrl` bug documented in the payments skill — watch for it anywhere an href/URL comes from outside the component's own routing logic.
- **CDN wildcard**: `next.config.ts`'s `remotePatterns` already covers `https://**`, so new external image hosts (flagcdn.com, Unsplash, etc.) don't need config changes — check before "fixing" a supposed missing-domain error.

## i18n namespace discipline

Before adding a new namespace, check whether an existing one already fits (e.g. reuse `account.shopNow` instead of duplicating a "shop now" CTA string in a new namespace). This project has accumulated ~20 namespaces (`header`, `Search`, `footer`, `cart`, `products`, `auth`, `account`, `checkout`, `nav`, `supplier`, `accountDeletion`, etc.) — grep `en.json` for a close match before inventing a new key.

## RTL / bidi rules — verify visually, don't assume

- **Use logical Tailwind properties** (`ps-*`/`pe-*`, `ms-*`/`me-*`, `start-*`/`end-*`, `gap-*`) instead of physical ones (`pl-*`/`pr-*`, `ml-*`/`mr-*`, `left`/`right`) in any new layout code. Two combined width utilities on one element (e.g. a shared `inputClass()` baking in `w-full` plus a caller appending `w-28`) is a real recurring bug class here — split into a width-free base class + per-field width instead.
- `@tailwindcss/forms`'s `<select>` chevron uses a hardcoded physical `background-position` that never flips for RTL — override explicitly with `rtl:bg-[left_...]` alongside the default `bg-[right_...]`.
- **Bidi digit/LTR-content wrapping**: an isolated multi-token LTR run inside RTL context (e.g. a space-separated phone number) needs `dir="ltr"` wrapping to avoid reordering. A single unbroken run (an email address) or digits anchored between strong-Arabic words usually **already** resolves correctly — don't blanket-wrap every LTR-looking string; test empirically in the browser first.
- `dir="auto"` on an **empty** `<input>`/`<textarea>` resolves to `ltr` even in an RTL document (browsers evaluate the field's _value_, not its placeholder) — this can detach trailing neutral punctuation (like "…") from an Arabic placeholder. Fix only fields empirically confirmed affected with `locale === "ar" ? "rtl" : "auto"`; don't apply it everywhere by default.
- Don't assume a layout mirrors correctly in Arabic just because the CSS is logical/Grid-based — this project's established practice is to actually load the `/ar/` route and look (or screenshot) before calling RTL work done.

## Known dev-server flakiness (not an app bug — don't debug your own code first)

`next dev` on this project periodically hits a documented failure: `not-found.tsx doesn't have a root layout` (`E394`) followed by a Fast-Refresh full-reload loop, after which every route (even unrelated ones) starts 500ing. Usually preceded by `.next/cache/webpack/*.pack.gz` rename-ENOENT warnings, and tends to appear after long dev-server uptime or many rapid HMR recompiles. **Fix**: stop the dev server, delete `.next` entirely, restart, then wait ~45s before the first request (deleting `.next` _while_ the server is starting reliably re-triggers it). If requests mysteriously stop reaching a page/action with no visible error, check the server log for `E394` before assuming your own code broke.

Related: after clearing `.next`, open a **new browser tab** rather than refreshing an old one, to avoid stale server-action IDs (`UnrecognizedActionError E715`).

## Windows-specific tooling notes

- `Remove-Item -Recurse -Force .next` in PowerShell, not `rm -rf`.
- `py`, not `python` (bare `python` is intercepted by the Microsoft Store shim).
- `docker cp`, not `docker compose cp` (broken on Windows).
- Sending Arabic/non-ASCII text through `curl`: write the payload to a `.json` file and send with `curl --data-binary @file.json` — an inline `-d '...'` string with Arabic content gets silently corrupted into `?` characters by Windows/MSYS argv handling, and the corruption is genuinely persisted to the database, not just a terminal display artifact.
