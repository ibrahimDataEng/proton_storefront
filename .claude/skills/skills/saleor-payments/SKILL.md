---
name: saleor-payments
description: Checkout, payment, and authentication rules for the Tawasi Plus storefront — the src/checkout/ protected-zone boundaries, the dual-auth-system split between the main app and the checkout sub-app, cookie/token architecture, and login throttling behavior. ALWAYS consult this before touching anything under src/checkout/, working on login/register/auth flows, payment gateways (Adyen/Stripe/COD), the checkout wizard, customer-recognition-in-checkout bugs, or any request that could plausibly require modifying payment logic — even if the request is framed as "just a small CSS tweak" to a checkout file.
---

# Checkout, Payments & Auth (Tawasi Plus)

## The protected zone — this is the single most important rule in this project

`src/checkout/` is a separate Saleor checkout sub-app. These paths are **permanently off-limits**, with no exception for "just this once" or "it's a tiny change":

```
src/checkout/hooks/                                  — NEVER TOUCH
src/checkout/state/                                  — NEVER TOUCH
src/checkout/graphql/                                — NEVER TOUCH
src/checkout/sections/PaymentSection/AdyenDropIn/    — NEVER TOUCH
src/checkout/sections/PaymentSection/StripeElements/ — NEVER TOUCH
```

- CSS `className` changes and UI-only component rewrites elsewhere in `src/checkout/` (e.g. `CheckoutStepper.tsx`, `CheckoutForm.tsx`'s JSX, trust-bar components) are permitted **only with explicit session approval** — don't assume a styling tweak is automatically fine just because it's not in the list above.
- If a task seems to require reading a value from an off-limits file (e.g. `useCheckout()`'s return shape), a **type-only reference** (`ReturnType<typeof useCheckout>`) is fine — importing and using the hook's live value without modifying the source file is not a violation. Session 37's GA4 tracking in `CheckoutForm.tsx` did exactly this.
- If a genuine data gap exists inside an off-limits fragment (e.g. `CheckoutLineFragment` has no product id, only `variant.id`), **do not edit the off-limits GraphQL file to add it.** Work around the gap (use what's available) and document the limitation instead.

## Payment methods

- **Cash on Delivery** is live in production.
- **Stripe** backend is live too (gateway id `com.tawasiplus.stripe_payment`, proton-payments' own registration — see CLAUDE.md's Checkout Sub-App section for the exact fix history and field names). `StripeElements/` stays in the permanently-off-limits list below regardless — any further change there still needs explicit session approval, the same as before.
- Payment method icons shown in the UI (Visa, Mastercard, Apple Pay, Amex, COD) are decorative/trust-signal only — they don't imply those gateways are wired up.

## Auth architecture — two separate systems, don't assume they're bridged

This app runs **two unbridged auth stacks**:

1. **Main storefront** — custom `src/lib/auth/` JWT stack. Cookies: `saleor_token` (access, ~5 min expiry) and `saleor_refresh_token` (refresh, 30 days), both **httpOnly**, `SameSite=Lax`. Middleware (`src/middleware.ts`) silently refreshes the access token when it's under 5 minutes from expiry. Tokens are **never** stored in localStorage or client state — mobile uses `expo-secure-store` instead, never `I18nManager`/AsyncStorage for tokens.
2. **Checkout sub-app** (`src/checkout/`, route at `src/app/[locale]/checkout/`, **outside** the `[channel]` segment and outside the main `AuthProvider`) — its own `SaleorAuthProvider`/`createSaleorAuthClient` from `@saleor/auth-sdk`.

A logged-in user reaching `/checkout` will show as a **guest** unless bridged. The fix that's already in place (session 38, `src/middleware.ts` only — no checkout file touched): the SDK has a one-shot bridge that reads a plain **non-httpOnly** cookie literally named `token` via `document.cookie`, adopts it, then deletes it itself. Middleware sets that cookie — `httpOnly:false`, `maxAge:60`, `secure` in production — **only** on `/checkout` paths and only when a valid access token exists. Known accepted limitation: this only seeds the checkout SDK's _access_ token; its refresh token is never populated, so a very long checkout session can silently fall back to guest UI once the access token expires. This is intentional and documented — don't "fix" it by trying to populate `localStorage` with the real refresh token.

If a future bug looks like "logged-in user treated as guest in checkout," check the bridge cookie and the middleware path-matching logic (`isCheckoutPath()`) before assuming `src/checkout/`'s own customer-recognition code (`useUser()`, `useCustomerAttach()`, `UserShippingAddressSection`) is broken — historically it was already correct and the bug was entirely on the bridging side.

## Login throttling behavior (so you don't misdiagnose a lockout)

- Saleor's built-in `authenticate_with_throttling()` blocks by IP after repeated failures, with an exponential `2^(attempts-1)`-second backoff capped at a `MAX_DELAY` (patched to 1200s / 20 min in this project — see `saleor-architecture` skill for the patch itself).
- Redis key `login:fail:ip:<ip>` is just the **attempt counter** (2-hour bookkeeping TTL) — it is _not_ the block itself. The actual block key is `login:block:ip:<ip>`; its TTL is the real remaining lockout time. Don't read the counter's TTL and report it as the lockout duration.
- Frontend: Saleor returns GraphQL error code `LOGIN_ATTEMPT_DELAYED` for this case. It must be explicitly mapped in `src/app/api/auth/login/route.ts`'s `ERROR_MAP` and given its own i18n key (`auth.errors.LOGIN_ATTEMPT_DELAYED`) — otherwise it silently falls through to a generic "something went wrong" message, which is confusing for a locked-out user who thinks their password is simply wrong.

## Password reset / account confirmation redirect pattern

Any `redirectUrl` sent to a Saleor mutation that emails a link (`accountRequestDeletion`, password reset, account confirmation) **must** include the full `/{locale}/{channel}` path prefix — e.g. `${origin}/${locale}/${channel}/reset-password`, built via `useLocale()` + `useParams<{channel}>()`. A bare `${origin}/reset-password` looks fine until next-intl's locale middleware rewrites it, at which point the App Router misresolves the 2-segment path (`locale=en, channel="reset-password"`) and silently falls through to the homepage instead of 404ing — a low-signal failure that's easy to miss in testing. Always grep for this exact bare-path pattern before copying any existing redirect-building code as a template; it has recurred multiple times in this codebase (`ForgotPasswordForm`, `RegisterForm` both had it at different points).
