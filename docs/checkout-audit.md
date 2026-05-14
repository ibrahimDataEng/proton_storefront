# Checkout Sub-App Audit

> Read-only audit conducted 2026-05-15. No source files were modified.

---

## Step 1 — Directory Map

```
src/checkout/
├── Root.tsx                          # Client root: UrqlProvider + ToastContainer + RootViews
├── index.css                         # 3 lines: imports react-toastify + adyen CSS only
├── assets/
│   ├── icons/                        # 18 SVG icon components (hardcoded #394052 fill/stroke)
│   └── images/SaleorLogo.tsx         # Saleor brand SVG logo
├── components/                       # 20 reusable UI primitives
│   ├── Address.tsx                   # Formatted address block
│   ├── AddressForm/                  # Address field form + validation schema
│   ├── AddressSectionSkeleton.tsx    # Skeleton loader for address section
│   ├── AddressSelectBox/             # Radio-card for selecting a saved address
│   ├── AddressSkeleton.tsx           # Skeleton for a single address card
│   ├── Button.tsx                    # primary/secondary/tertiary variants
│   ├── Checkbox.tsx                  # Styled checkbox input
│   ├── CountrySelect.tsx             # Native <select> for country
│   ├── Divider/                      # <hr> with border-neutral-200
│   ├── ErrorContentWrapper.tsx       # Error state container (bg-neutral-50)
│   ├── IconButton.tsx                # Icon-only button with ring focus
│   ├── LinkAsButton.tsx              # <a> styled identically to Button
│   ├── ManualSaveAddressForm/        # Address form with explicit save/cancel
│   ├── Money.tsx                     # Formatted currency display
│   ├── PasswordInput/                # Password input with show/hide toggle
│   ├── Select.tsx                    # Native <select> with custom label
│   ├── SelectBox/                    # Radio input as a selectable card
│   ├── SelectBoxGroup.tsx            # Container for SelectBox items
│   ├── Skeleton/                     # Animated skeleton bar (bg-neutral-100)
│   ├── TextInput.tsx                 # Labeled text input with error state
│   └── Title.tsx                     # Section heading
├── content/locales/en-US.json        # Localisation strings (English only)
├── graphql/                          # .graphql source files + generated index.ts (~26k lines)
├── hooks/                            # 15+ custom hooks (form, auth, alerts, state, fetch)
├── lib/
│   ├── checkoutMessages.ts           # All UI strings for EN + AR (hardcoded in file)
│   ├── consts/countries.ts           # Country list
│   ├── consts/inputAttributes.ts     # Input HTML attributes
│   ├── globalTypes.ts                # Shared TS types
│   ├── regions.ts                    # Region/locale helpers
│   └── utils/                        # money, url, locale, phoneNumber helpers
├── providers/AppConfigProvider/
│   └── consts.ts                     # defaultAppColors — 7 hardcoded hex values
├── sections/
│   ├── AddressCreateForm/            # Form to create address (logged-in users)
│   ├── AddressEditForm/              # Form to edit a saved address
│   ├── AddressList/                  # List of saved addresses with selection
│   ├── CheckoutForm/
│   │   ├── CheckoutForm.tsx          # Left-column orchestrator (Contact → Address → Delivery → Payment)
│   │   ├── CheckoutFormSkeleton.tsx  # Skeleton for entire left column
│   │   └── CollapseSection.tsx       # Collapse wrapper (hide when only contact shown)
│   ├── Contact/                      # Section switching: GuestUser / SignIn / SignedInUser / ResetPassword
│   ├── DeliveryMethods/              # Shipping method selection (SelectBox cards)
│   ├── GuestBillingAddressSection/   # Billing address form for guests
│   ├── GuestShippingAddressSection/  # Shipping address form for guests
│   ├── GuestUser/                    # Email entry for guest checkout
│   ├── OrderInfo/                    # Order confirmation detail blocks (delivery + payment)
│   ├── PaymentSection/
│   │   ├── PaymentSection.tsx        # Title + PaymentMethods
│   │   ├── PaymentMethods.tsx        # Routes to Adyen / Stripe / Dummy by gateway
│   │   ├── PaymentProcessingScreen.tsx  # Full-screen overlay during payment (bg-gray-100)
│   │   ├── PaymentSectionSkeleton.tsx
│   │   ├── AdyenDropIn/              # ⚠️ Adyen integration (complex, DO NOT touch logic)
│   │   ├── StripeElements/           # ⚠️ Stripe integration (complex, DO NOT touch logic)
│   │   └── DummyDropIn/              # Test/dev payment component
│   ├── ResetPassword/                # Password reset form
│   ├── SignIn/                       # Sign-in form within checkout
│   ├── SignedInUser/                 # Logged-in user display + sign-out
│   ├── Summary/
│   │   ├── Summary.tsx               # Order summary (items + promo + totals)
│   │   ├── SummaryItem.tsx           # Product line with image thumbnail
│   │   ├── PromoCodeAdd.tsx          # Promo code input
│   │   ├── SummaryMoneyRow.tsx       # Label + amount row
│   │   ├── SummaryPromoCodeRow.tsx   # Promo row with remove action
│   │   ├── SummaryItemMoneyEditableSection.tsx  # Editable qty in summary
│   │   ├── SummaryItemMoneyInfo.tsx  # Per-item price display
│   │   ├── SummaryItemMoneySection.tsx  # Non-editable price (order confirmation)
│   │   └── SummarySkeleton.tsx
│   ├── UserAddressSectionContainer.tsx
│   ├── UserBillingAddressSection/
│   └── UserShippingAddressSection/
├── state/
│   ├── checkoutValidationStateStore/ # ⚠️ Form validation state (Zustand-style)
│   └── updateStateStore/             # ⚠️ API request tracking state
├── ui-kit/icons/                     # 9 additional SVG icon components
└── views/
    ├── Checkout/
    │   ├── Checkout.tsx              # Main 2-col layout (CheckoutForm + Summary)
    │   ├── CheckoutDiscovery.tsx     # "You might also like" panel above form
    │   ├── CheckoutSkeleton.tsx      # Full-page skeleton
    │   └── index.tsx
    ├── EmptyCartPage/                # Empty cart state view
    ├── OrderConfirmation/
    │   ├── OrderConfirmation.tsx     # Post-purchase confirmation + order summary
    │   └── OrderConfirmationSkeleton.tsx
    ├── PageNotFound/                 # 404 fallback
    └── RootViews.tsx                 # Router: orderId? → OrderConfirmation : Checkout
```

---

## Step 2 — Styling Approach

### 1. Tailwind usage — hardcoded semantics, no CSS variables

Yes, checkout uses Tailwind throughout. Every color is a hardcoded Tailwind class:

- `neutral-*` (50 / 100 / 200 / 300 / 400 / 500 / 600 / 700 / 800 / 900)
- `gray-100` (PaymentProcessingScreen only)
- `green-100`, `green-600`, `green-700` (OrderConfirmation checkmark)
- `blue-50`, `blue-700` (OrderConfirmation help banner)
- `emerald-50`, `emerald-300`, `emerald-700` (CheckoutDiscovery panel)
- `red-300`, `red-500` (error states in TextInput, PasswordInput)
- `black`, `white` (various buttons and backgrounds)

**Zero CSS custom property (`var(--...)`) usage anywhere in src/checkout/.**

### 2. Dedicated CSS file

`src/checkout/index.css` — only 3 import statements:

```css
@import "react-toastify/dist/ReactToastify.css";
@import "@adyen/adyen-web/dist/adyen.css";
@import "./sections/PaymentSection/AdyenDropIn/adyenDropin.css";
```

No custom utility classes, no checkout-specific color definitions.

### 3. Imports from globals.css or tokens.ts

**None.** No file in src/checkout/ imports from `src/app/[locale]/globals.css` or `src/ui/theme/tokens.ts`. The checkout sub-app is completely isolated from the storefront's design token system.

### 4. Font

No font declaration inside checkout. The checkout page lives at `src/app/[locale]/checkout/` with its own `layout.tsx` that wraps only `<main>` + `<AuthProvider>` — it does **not** extend the `(main)` group layout. However, Next.js applies `next/font` CSS variables at the `<html>` level via the root layout (`src/app/[locale]/layout.tsx`), so IBM Plex Sans **is inherited** — but this is implicit, not intentional.

### 5. Inline style= with hardcoded colors

- **SVG assets** (`src/checkout/assets/icons/*.tsx`): all use hardcoded hex `stroke="#394052"` and `fill="#394052"` (navy-grey). Error icons use `#B65757`, success icons use `#2C9B2A`.
- **AppConfigProvider/consts.ts**: `defaultAppColors` object with 7 hardcoded hex values (`#394052`, `#FFFFFF`, `#2C9B2A`, `#B65757`) — used to style payment provider UI (Adyen/Stripe button colors).
- **Adyen integration**: `buttonColor: "black"` in two files (`createAdyenCheckout.ts`, `utils.ts`).
- No React `style={}` props with inline hex in regular component files.

---

## Step 3 — Component Inventory

### src/checkout/components/

| File                         | Description                                                                |
| ---------------------------- | -------------------------------------------------------------------------- |
| `Address.tsx`                | Renders a formatted multi-line address block                               |
| `AddressForm/`               | Multi-field address form (street, city, postal, phone, country)            |
| `AddressSectionSkeleton.tsx` | Skeleton loader shaped like an address section                             |
| `AddressSelectBox/`          | Radio-style selectable card for a saved address                            |
| `AddressSkeleton.tsx`        | Skeleton for a single address card row                                     |
| `Button.tsx`                 | Primary/secondary/tertiary button (neutral-900 / transparent / borderless) |
| `Checkbox.tsx`               | Styled checkbox with neutral-300 border and neutral-600 check color        |
| `CountrySelect.tsx`          | Country dropdown backed by countries const list                            |
| `Divider/`                   | Horizontal `<hr>` (border-neutral-200)                                     |
| `ErrorContentWrapper.tsx`    | Centered error container with neutral-50 background                        |
| `IconButton.tsx`             | Focusable icon-only button with ring-neutral-200 focus                     |
| `LinkAsButton.tsx`           | `<a>` element styled identically to Button component                       |
| `ManualSaveAddressForm/`     | Address form with explicit Save/Cancel action buttons                      |
| `Money.tsx`                  | Formatted currency amount display                                          |
| `PasswordInput/`             | Text input with eye-icon toggle for password visibility                    |
| `Select.tsx`                 | Labeled native `<select>` with neutral-300 border                          |
| `SelectBox/`                 | Radio input rendered as a bordered selectable card                         |
| `SelectBoxGroup.tsx`         | Group wrapper for a set of SelectBox items                                 |
| `Skeleton/`                  | Animated bg-neutral-100 placeholder bar                                    |
| `TextInput.tsx`              | Labeled text input with error state (border-red-300 on error)              |
| `Title.tsx`                  | Section heading `<h2>`                                                     |

### src/checkout/sections/

| Section                                       | Description                                                                          |
| --------------------------------------------- | ------------------------------------------------------------------------------------ |
| `AddressCreateForm/`                          | Create new address form for authenticated users                                      |
| `AddressEditForm/`                            | Edit an existing saved address                                                       |
| `AddressList/`                                | Paginated list of user's saved addresses with radio selection                        |
| `CheckoutForm/CheckoutForm.tsx`               | Left-column orchestrator: renders Contact → Address → Delivery → Payment in sequence |
| `CheckoutForm/CheckoutFormSkeleton.tsx`       | Skeleton for entire checkout left column                                             |
| `CheckoutForm/CollapseSection.tsx`            | Wrapper that hides its children when `collapse` prop is true                         |
| `Contact/Contact.tsx`                         | State machine switching between GuestUser / SignIn / SignedInUser / ResetPassword    |
| `Contact/ContactSkeleton.tsx`                 | Skeleton for the contact email section                                               |
| `Contact/SignInFormContainer.tsx`             | Container wrapping the sign-in form                                                  |
| `DeliveryMethods/DeliveryMethods.tsx`         | Renders available shipping methods as SelectBox cards                                |
| `DeliveryMethods/DeliveryMethodsSkeleton.tsx` | Skeleton for delivery method cards                                                   |
| `GuestBillingAddressSection/`                 | Billing address entry form for guests (with "same as shipping" checkbox)             |
| `GuestShippingAddressSection/`                | Shipping address entry form for guests                                               |
| `GuestUser/GuestUser.tsx`                     | Email input step for guest checkout flow                                             |
| `OrderInfo/OrderInfo.tsx`                     | Order confirmation info: delivery + payment summary blocks                           |
| `OrderInfo/DeliverySection.tsx`               | Delivery address block within order confirmation                                     |
| `OrderInfo/PaymentSection.tsx`                | Payment method block within order confirmation                                       |
| `OrderInfo/Section.tsx`                       | Labeled section wrapper used by OrderInfo                                            |
| `PaymentSection/PaymentSection.tsx`           | Payment section title + PaymentMethods router                                        |
| `PaymentSection/PaymentMethods.tsx`           | Routes to correct payment gateway (Adyen/Stripe/Dummy)                               |
| `PaymentSection/PaymentProcessingScreen.tsx`  | Fixed full-screen overlay during payment (bg-gray-100 + BarLoader)                   |
| `PaymentSection/PaymentSectionSkeleton.tsx`   | Skeleton for payment section                                                         |
| `PaymentSection/AdyenDropIn/`                 | Full Adyen Drop-in integration (complex — DO NOT touch)                              |
| `PaymentSection/StripeElements/`              | Full Stripe Elements integration (complex — DO NOT touch)                            |
| `PaymentSection/DummyDropIn/`                 | Dummy payment component for dev/test                                                 |
| `ResetPassword/ResetPassword.tsx`             | Password reset form for checkout context                                             |
| `SignIn/SignIn.tsx`                           | Sign-in form embedded within checkout contact step                                   |
| `SignedInUser/SignedInUser.tsx`               | Displays logged-in user email with sign-out link                                     |
| `Summary/Summary.tsx`                         | Right-column order summary: items list + promo + subtotal + shipping + total         |
| `Summary/SummaryItem.tsx`                     | Single product line item with thumbnail image (16×16 / 24×24)                        |
| `Summary/PromoCodeAdd.tsx`                    | Promo/gift-card input field with apply button                                        |
| `Summary/SummaryMoneyRow.tsx`                 | Label + formatted amount row                                                         |
| `Summary/SummaryPromoCodeRow.tsx`             | Applied promo code row with optional remove action                                   |
| `Summary/SummaryItemMoneyEditableSection.tsx` | Editable quantity field within summary item                                          |
| `Summary/SummaryItemMoneyInfo.tsx`            | Per-unit price display (highlights sale price)                                       |
| `Summary/SummaryItemMoneySection.tsx`         | Non-editable price section (used in order confirmation)                              |
| `Summary/SummarySkeleton.tsx`                 | Skeleton for the entire summary panel                                                |
| `UserAddressSectionContainer.tsx`             | Wrapper delegating to user shipping + billing sections                               |
| `UserBillingAddressSection/`                  | Billing address management for authenticated users                                   |
| `UserShippingAddressSection/`                 | Shipping address management for authenticated users                                  |

---

## Step 4 — Entry Point

### Mount path

The checkout is a separate Next.js route at `src/app/[locale]/checkout/page.tsx`. It is **not** inside the `(main)` route group, so it does not share the main storefront layout (no header, no footer, no TopBar).

### Root element (page.tsx:27)

```tsx
<div className="min-h-dvh bg-white" dir={locale === "ar" ? "rtl" : "ltr"}>
  <section className="mx-auto flex min-h-dvh max-w-7xl flex-col p-8">
    <div className="flex items-center font-bold">
      <Link ...>Green Line Store</Link>
    </div>
    <h1 className="mt-8 text-3xl font-bold text-neutral-900">Checkout</h1>
    <RootWrapper saleorApiUrl={...} />
  </section>
</div>
```

### Provider tree

```
layout.tsx (<main> + AuthProvider)
  └── page.tsx (bg-white shell + logo + h1)
      └── pageWrapper.tsx (RootWrapper → SaleorAuthProvider)
          └── Root.tsx ("use client")
              ├── UrqlProvider (urql GraphQL client)
              ├── ToastContainer (react-toastify alerts)
              └── ErrorBoundary (FallbackComponent=PageNotFound)
                  └── RootViews.tsx
                      ├── OrderConfirmation (if ?orderId)
                      └── PaymentProcessingScreen → Checkout
                          ├── CheckoutDiscovery (category suggestions)
                          ├── CheckoutForm (left col)
                          └── Summary (right col)
```

---

## Step 5 — Current Color Tokens Used

All hardcoded Tailwind color classes found in checkout (excluding graphql/index.ts):

| Class / Value             | Location                                                                           | Purpose                        |
| ------------------------- | ---------------------------------------------------------------------------------- | ------------------------------ |
| `bg-neutral-900`          | Button, LinkAsButton, StripeElementsForm, CheckoutDiscovery                        | Primary CTA background         |
| `hover:bg-neutral-800`    | Button, LinkAsButton, StripeElementsForm, OrderConfirmation                        | CTA hover                      |
| `disabled:bg-neutral-700` | Button, StripeElementsForm                                                         | Disabled CTA                   |
| `border-neutral-600`      | Button secondary                                                                   | Secondary border               |
| `hover:bg-neutral-300`    | Button secondary                                                                   | Secondary hover fill           |
| `bg-neutral-50`           | ErrorContentWrapper, SummaryItem, Summary pseudo-element                           | Panel backgrounds              |
| `border-neutral-200`      | AddressSkeleton, DeliveryMethodsSkeleton, PaymentSectionSkeleton, Divider, Summary | Borders                        |
| `bg-neutral-100`          | Skeleton                                                                           | Skeleton placeholder           |
| `text-neutral-900`        | CheckoutDiscovery, page.tsx h1                                                     | Dark headings                  |
| `text-neutral-700`        | PasswordInput, Select, CheckoutDiscovery, OrderConfirmation                        | Labels                         |
| `text-neutral-600`        | CheckoutDiscovery                                                                  | Description text               |
| `text-neutral-500`        | SummaryItem, OrderConfirmation                                                     | Secondary text                 |
| `text-neutral-300`        | CheckoutDiscovery dark card                                                        | Subdued text on dark bg        |
| `border-neutral-300`      | Button secondary, Checkbox, Select, SelectBox, TextInput, OrderConfirmation        | Form borders                   |
| `border-neutral-400`      | SelectBox                                                                          | Default selectable card border |
| `border-neutral-500`      | SelectBox selected                                                                 | Selected card border           |
| `ring-neutral-200`        | Checkbox, SelectBox, IconButton, TextInput                                         | Focus ring                     |
| `focus:ring-neutral-200`  | Checkbox, TextInput, PasswordInput, Select                                         | Focus ring on inputs           |
| `bg-neutral-100`          | Skeleton                                                                           | Skeleton color                 |
| `bg-gray-100`             | PaymentProcessingScreen overlay                                                    | Payment loading bg             |
| `bg-green-100`            | OrderConfirmation checkmark circle                                                 | Success icon bg                |
| `text-green-600`          | OrderConfirmation checkmark SVG                                                    | Success icon color             |
| `text-green-700`          | OrderConfirmation title                                                            | Success heading                |
| `bg-blue-50`              | OrderConfirmation help banner                                                      | Info section bg                |
| `text-blue-700`           | OrderConfirmation help banner                                                      | Info section text              |
| `text-emerald-700`        | CheckoutDiscovery eyebrow, category link hover                                     | Emerald accent                 |
| `text-emerald-300`        | CheckoutDiscovery dark card                                                        | Dark-bg emerald accent         |
| `border-emerald-500`      | CheckoutDiscovery category link hover                                              | Category link hover            |
| `to-emerald-50`           | CheckoutDiscovery gradient                                                         | Panel background tint          |
| `bg-black`                | OrderConfirmation CTA                                                              | Continue shopping button       |
| `text-white`              | Button primary, CheckoutDiscovery dark card, StripeElementsForm                    | Text on dark bg                |
| `border-red-300`          | TextInput, PasswordInput error                                                     | Input error border             |
| `text-red-500`            | TextInput, PasswordInput, Select error                                             | Error message text             |
| `text-red-500`            | OrderInfo/PaymentSection                                                           | Payment error text             |
| `#394052`                 | All SVG assets/icons, AppConfigProvider defaults                                   | Icon stroke/fill               |
| `#B65757`                 | alert.tsx, error.tsx icons, AppConfigProvider errorColor                           | Error icon color               |
| `#2C9B2A`                 | success.tsx icon, AppConfigProvider successColor                                   | Success icon color             |
| `#FFFFFF`                 | AppConfigProvider buttonTextColor, language icon bg                                | Button text                    |
| `black`                   | Adyen createAdyenCheckout.ts, utils.ts buttonColor                                 | Adyen button                   |

---

## Step 6 — Trust & UX Elements Audit

| Element                                               | Present?    | Notes                                                                                                                                                         |
| ----------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Progress/stepper (Contact → Shipping → Payment)       | **No**      | Uses CollapseSection to hide/show sections but no visual step indicator                                                                                       |
| Trust badges / security icons (SSL, "Secure Payment") | **No**      | Nothing in any component                                                                                                                                      |
| WhatsApp or support widget                            | **Partial** | `checkoutMessages.ts:130` has the string "Need help? Contact us via WhatsApp or email" shown as plain text in OrderConfirmation — no link, no floating widget |
| Order summary with product images                     | **Yes**     | `SummaryItem.tsx` renders `<img src={productImage.url}>` (16×16 / 24×24 thumbnail)                                                                            |
| Animation (framer-motion)                             | **No**      | No framer-motion imports anywhere. Only `react-spinners` BarLoader (payment overlay) and Tailwind `animate-spin` (Stripe form)                                |

---

## Step 7 — Summary Report

### 1. Theming Gap

The checkout sub-app is **completely disconnected** from the main storefront's design token system.

| Issue                         | Detail                                                                                        |
| ----------------------------- | --------------------------------------------------------------------------------------------- |
| No CSS custom properties      | Zero use of `var(--brand-primary)`, `var(--surface-base)`, etc.                               |
| Primary button is wrong color | `bg-neutral-900` (near-black) vs storefront brand `#2D6A4F` (green)                           |
| Summary background            | `bg-neutral-50` / `border-neutral-200` — not tied to `--surface-raised` token                 |
| Payment processing overlay    | `bg-gray-100` — not a storefront surface token                                                |
| Order confirmation CTA        | `bg-black` — should use brand-primary                                                         |
| Icon colors                   | All SVG icons hardcoded to `#394052` (dark navy) — brand mismatch                             |
| Payment button config         | `AppConfigProvider/consts.ts` has `buttonBgColorPrimary: "#394052"` — shipped to Adyen/Stripe |
| Adyen buttonColor             | `"black"` hardcoded in two places                                                             |
| Font inheritance              | Implicit only (root layout CSS var), not intentional or guaranteed                            |
| CheckoutDiscovery emerald-\*  | Uses `emerald-*` which is close to brand-primary but isn't CSS-variable-based                 |

**Minimum work to close the gap:** update `Button.tsx`, `LinkAsButton.tsx`, `defaultAppColors`, SVG icon strokes, page.tsx shell classes, and the Summary panel pseudo-element to use the storefront's brand token values.

---

### 2. UX Gaps

| Gap                                                       | Impact                                                                                 |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| No checkout progress stepper                              | Users can't orient themselves (Contact / Shipping / Payment / Review)                  |
| No animated section transitions                           | CollapseSection show/hide is abrupt — no height animation or fade                      |
| No order review step                                      | Form jumps straight to payment; no "confirm everything before paying" screen           |
| No back navigation                                        | No breadcrumb or back button; users rely on browser back                               |
| No order confirmation animation                           | Success screen has a checkmark icon but no celebration animation                       |
| OrderConfirmation uses raw `<a href>`                     | Should use `LinkWithChannel` to respect locale/channel routing                         |
| CheckoutDiscovery gradient mismatch                       | Uses `from-neutral-50 via-white to-emerald-50` — doesn't match storefront palette      |
| Payment section has no "Place order" button label context | Button just says the payment label, not "Pay and confirm order"                        |
| Empty cart page has minimal styling                       | Only a Title component — no illustration or CTA matching the main EmptyState component |

---

### 3. Trust Gaps

| Gap                                              | Impact                                                                                                       |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| No secure/SSL badge above payment section        | High-converting trust signal missing at the most critical moment                                             |
| No payment method icons (Visa/MC/Amex/Apple Pay) | Users don't know what's accepted until they reach the Stripe/Adyen widget                                    |
| WhatsApp help is plain text only                 | `"Need help? Contact us via WhatsApp or email"` in order confirmation — no link, not visible during checkout |
| No trust statement                               | No "Your payment is 256-bit SSL encrypted" or equivalent                                                     |
| No return/refund policy brief                    | No "Free returns" or "30-day guarantee" copy near the payment button                                         |
| No real-time security indicators                 | 3D Secure is supported in backend but there's no UX preparation for it                                       |

---

### 4. Risk Zones (avoid touching logic here)

| File / Directory                                                                   | Reason                                                                                            |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `src/checkout/sections/PaymentSection/AdyenDropIn/`                                | Complex Adyen Drop-in integration with 3DS, checkout submission, and retry logic                  |
| `src/checkout/sections/PaymentSection/StripeElements/`                             | Stripe Elements form with payment confirmation state machine                                      |
| `src/checkout/state/updateStateStore/`                                             | Zustand-style store tracking all in-flight API mutations — modifying breaks race-condition guards |
| `src/checkout/state/checkoutValidationStateStore/`                                 | Validation gating logic — forms only proceed when all validators pass                             |
| `src/checkout/hooks/useSubmit/`, `useFormSubmit/`, `useCheckoutComplete.ts`        | Checkout submission pipeline — one wrong change drops orders silently                             |
| `src/checkout/hooks/useForm/`                                                      | Custom form engine with field tracking and submission handlers                                    |
| `src/checkout/graphql/index.ts`                                                    | 26k-line generated file — DO NOT touch                                                            |
| `src/checkout/sections/GuestBillingAddressSection/useBillingSameAsShippingForm.ts` | Billing sync logic — fragile state                                                                |

---

### 5. Safe Zones (styling changes only, no logic risk)

| File / Directory                                                    | What can change                                                                           |
| ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `src/app/[locale]/checkout/page.tsx`                                | `bg-white` → brand surface, `text-neutral-900` → content-primary token, logo link styling |
| `src/checkout/components/Button.tsx`                                | Primary: `bg-neutral-900` → brand-primary; all neutral-\* color classes                   |
| `src/checkout/components/LinkAsButton.tsx`                          | Same changes as Button.tsx                                                                |
| `src/checkout/components/TextInput.tsx`                             | Border, label, focus ring colors                                                          |
| `src/checkout/components/PasswordInput/PasswordInput.tsx`           | Border, label, focus ring colors                                                          |
| `src/checkout/components/Checkbox.tsx`                              | Border and check colors                                                                   |
| `src/checkout/components/Select.tsx`                                | Border, label, focus ring colors                                                          |
| `src/checkout/components/SelectBox/SelectBox.tsx`                   | Border and selected-state colors                                                          |
| `src/checkout/components/Divider/Divider.tsx`                       | Single `border-neutral-200` class                                                         |
| `src/checkout/components/Skeleton/Skeleton.tsx`                     | Single `bg-neutral-100` class                                                             |
| `src/checkout/components/ErrorContentWrapper.tsx`                   | `bg-neutral-50` background                                                                |
| `src/checkout/assets/icons/*.tsx`                                   | SVG `stroke`/`fill` hardcoded hex values (#394052, #B65757, #2C9B2A)                      |
| `src/checkout/providers/AppConfigProvider/consts.ts`                | `defaultAppColors` hex values (controls Adyen/Stripe button appearance)                   |
| `src/checkout/sections/Summary/Summary.tsx`                         | `before:bg-neutral-50`, `before:border-neutral-200` pseudo-element                        |
| `src/checkout/sections/Summary/SummaryItem.tsx`                     | `bg-neutral-50`, `text-neutral-500`, border colors                                        |
| `src/checkout/sections/Summary/SummarySkeleton.tsx`                 | `bg-neutral-100` dividers                                                                 |
| `src/checkout/sections/PaymentSection/PaymentProcessingScreen.tsx`  | `bg-gray-100` → brand surface token                                                       |
| `src/checkout/views/OrderConfirmation/OrderConfirmation.tsx`        | Button classes, help banner colors (bg-blue-50 → brand surface)                           |
| `src/checkout/views/Checkout/CheckoutDiscovery.tsx`                 | All emerald-_ and neutral-_ classes; gradient definition                                  |
| `src/checkout/sections/DeliveryMethods/DeliveryMethodsSkeleton.tsx` | `border-neutral-200`                                                                      |
| `src/checkout/sections/PaymentSection/PaymentSectionSkeleton.tsx`   | `border-neutral-200`                                                                      |
