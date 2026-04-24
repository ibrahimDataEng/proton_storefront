import { useCheckoutMessages } from "@/checkout/lib/checkoutMessages";

export const useApiErrorMessages = () => useCheckoutMessages().apiErrors;
