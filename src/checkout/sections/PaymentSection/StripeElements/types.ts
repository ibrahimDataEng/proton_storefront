// This project's own registered Stripe payment app (proton-payments,
// gateway id "com.tawasiplus.stripe_payment") — not Saleor's generic
// example id, confirmed against the actual production App registration.
export const stripeGatewayId = "com.tawasiplus.stripe_payment";
export type StripeGatewayId = typeof stripeGatewayId;
