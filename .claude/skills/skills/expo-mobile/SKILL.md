---
name: expo-mobile
description: Mobile app conventions for the Tawasi Plus Expo/React Native app (the mobile counterpart to the proton_storefront Next.js site) — direct-to-Saleor API access, RTL/locale handling, i18n plural rules, and repo tooling setup. ALWAYS consult this before touching the mobile app's networking layer, language/RTL switching, count-bearing translated strings, or its beads/git hook setup. Note: this skill currently reflects only what's been explicitly documented in this project's MOBILE.md summary — if you find MOBILE.md itself available in the repo, read it directly for anything not covered here rather than assuming this skill is complete.
---

# Expo Mobile App Conventions (Tawasi Plus)

**Scope note**: this is a separate mobile client for the same Tawasi Plus / Saleor backend covered by the other Proton skills (`saleor-architecture`, `saleor-graphql`, etc.) — not to be confused with any other unrelated React Native project. The facts below are everything currently documented from the project's `MOBILE.md`; that file (imported by a thin `CLAUDE.md` in the mobile repo) is the authoritative, fuller source — read it directly when it's available rather than treating this skill as exhaustive.

## Networking

- The mobile app calls the Saleor GraphQL API **directly — there is no BFF/proxy layer** the way the Next.js storefront might use one. Any auth, error-shaping, or caching logic needs to live in the mobile app itself; don't assume a shared server-side layer exists to lean on.
- Auth tokens are stored in **`expo-secure-store`**, never `AsyncStorage` and never any web-style cookie mechanism (there's no cookie jar on native). This mirrors the storefront's "never localStorage" rule for the same underlying reason — tokens must not sit in an easily-readable plain store.

## RTL & locale — stricter than the web storefront

- RTL is applied via a **one-time `forceRTL` call at app boot**, with a branded `reloadAsync` triggered specifically on a language switch (since React Native, unlike a web page, can't just re-render into the opposite text direction without a native reload).
- **No application code may ever read `I18nManager.isRTL`.** The selected locale is the **single source of truth** for direction — derive RTL-ness from the locale setting, not from the native RTL flag, anywhere in the app. This is a hard rule, not a style preference; treat any new code that branches on `I18nManager.isRTL` as a bug to fix, not a pattern to extend.

## i18n plural rules

- **Every count-bearing translated string must use a full ICU plural block** — not a bare `{count}` interpolation into a single string. This exists specifically to get **Arabic plural/noun-form correctness** right (Arabic has more grammatical number categories than English's singular/plural, and a naive `{count} منتج`-style interpolation produces grammatically wrong output for several count ranges). See MOBILE.md §9 for the full rule if you need the exact ICU category breakdown (zero/one/two/few/many/other) — don't approximate it with a simplified two-case plural.

## Repo tooling

- **`beads` (`bd`) git hooks are managed via a `core.hooksPath` redirect** in this repo, not the default `.git/hooks` — if `bd` hooks seem to not be firing, check `core.hooksPath` before assuming `bd` itself is misconfigured.
- **Auto-export and autonomous git push were deliberately neutralized** in this repo's hook setup — if you notice `bd` or a hook trying to push automatically, that's a regression to flag, not an existing feature to rely on. This is consistent with the storefront-wide rule that Claude/tooling never pushes autonomously (see `production-review` skill) — here it's additionally enforced at the git-hooks level.
- `CLAUDE.md` in the mobile repo is intentionally a **thin file that just imports `MOBILE.md`** — the real content lives in `MOBILE.md`. If you're editing project memory/instructions for the mobile app, edit `MOBILE.md`, not the thin `CLAUDE.md` wrapper.
