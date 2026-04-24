import { useCheckoutMessages } from "@/checkout/lib/checkoutMessages";

export const useAdyenErrorMessages = () => useCheckoutMessages().adyenErrors;
