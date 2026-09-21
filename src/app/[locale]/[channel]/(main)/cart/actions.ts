"use server";

import { revalidatePath } from "next/cache";
import { executeGraphQL } from "@/lib/graphql";
import {
	CheckoutAddLineDocument,
	CheckoutAddLineWithQuantityDocument,
	CheckoutDeleteLinesDocument,
	CheckoutLinesUpdateDocument,
	CheckoutAddPromoCodeDocument,
	CheckoutRemovePromoCodeDocument,
} from "@/gql/graphql";
import * as Checkout from "@/lib/checkout";

type deleteLineFromCheckoutArgs = {
	lineId: string;
	checkoutId: string;
};

export const deleteLineFromCheckout = async ({ lineId, checkoutId }: deleteLineFromCheckoutArgs) => {
	await executeGraphQL(CheckoutDeleteLinesDocument, {
		variables: {
			checkoutId,
			lineIds: [lineId],
		},
		cache: "no-cache",
	});

	revalidatePath("/", "layout");
};

export async function addLineToCheckout({
	variantId,
	channel,
	locale,
}: {
	variantId: string;
	channel: string;
	locale: string;
}): Promise<{ ok: boolean; redirect: boolean; errorCode?: string; errorMessage?: string }> {
	let checkoutId = await Checkout.getIdFromCookies(channel);
	if (!checkoutId) {
		const checkout = await Checkout.findOrCreate({ channel, locale });
		if (!checkout?.id) return { ok: false, redirect: false };
		await Checkout.saveIdToCookie(channel, checkout.id);
		checkoutId = checkout.id;
	}
	const result = await executeGraphQL(CheckoutAddLineDocument, {
		variables: { id: checkoutId, productVariantId: variantId },
		cache: "no-cache",
	});
	const errors = result.checkoutLinesAdd?.errors ?? [];
	if (errors.length > 0) {
		return {
			ok: false,
			redirect: false,
			errorCode: errors[0]?.code ?? undefined,
			errorMessage: errors[0]?.message ?? undefined,
		};
	}
	revalidatePath("/", "layout");
	return { ok: true, redirect: false };
}

export async function addLineWithQuantity({
	variantId,
	channel,
	quantity,
	locale,
}: {
	variantId: string;
	channel: string;
	quantity: number;
	locale: string;
}): Promise<{ ok: boolean; redirect: boolean; errorCode?: string; errorMessage?: string }> {
	let checkoutId = await Checkout.getIdFromCookies(channel);
	if (!checkoutId) {
		const checkout = await Checkout.findOrCreate({ channel, locale });
		if (!checkout?.id) return { ok: false, redirect: false };
		await Checkout.saveIdToCookie(channel, checkout.id);
		checkoutId = checkout.id;
	}
	const result = await executeGraphQL(CheckoutAddLineWithQuantityDocument, {
		variables: { id: checkoutId, productVariantId: variantId, quantity },
		cache: "no-cache",
	});
	const errors = result.checkoutLinesAdd?.errors ?? [];
	if (errors.length > 0) {
		return {
			ok: false,
			redirect: false,
			errorCode: errors[0]?.code ?? undefined,
			errorMessage: errors[0]?.message ?? undefined,
		};
	}
	revalidatePath("/", "layout");
	return { ok: true, redirect: false };
}

export async function updateLineQuantity({
	lineId,
	checkoutId,
	quantity,
}: {
	lineId: string;
	checkoutId: string;
	quantity: number;
}): Promise<{ ok: boolean }> {
	const result = await executeGraphQL(CheckoutLinesUpdateDocument, {
		variables: { checkoutId, lines: [{ lineId, quantity }] },
		cache: "no-cache",
	});
	const errors = result.checkoutLinesUpdate?.errors ?? [];
	if (errors.length > 0) {
		return { ok: false };
	}
	revalidatePath("/", "layout");
	return { ok: true };
}

const PROMO_ERROR_MAP: Record<string, string> = {
	INVALID: "promoInvalid",
	NOT_APPLICABLE: "promoNotApplicable",
	VOUCHER_NOT_APPLICABLE: "promoNotApplicable",
};

export async function applyPromoCode(
	checkoutId: string,
	promoCode: string,
): Promise<{
	ok: boolean;
	error?: string;
	discount?: { amount: number; currency: string } | null;
	discountName?: string | null;
	voucherCode?: string | null;
}> {
	const result = await executeGraphQL(CheckoutAddPromoCodeDocument, {
		variables: { checkoutId, promoCode },
		cache: "no-cache",
	});
	const errors = result.checkoutAddPromoCode?.errors ?? [];
	if (errors.length > 0) {
		const code = errors[0]?.code ?? "unknown";
		const errorKey = PROMO_ERROR_MAP[code] ?? "unknown";
		return { ok: false, error: errorKey };
	}
	revalidatePath("/", "layout");
	const checkout = result.checkoutAddPromoCode?.checkout;
	return {
		ok: true,
		discount: checkout?.discount ?? null,
		discountName: checkout?.discountName ?? null,
		voucherCode: checkout?.voucherCode ?? null,
	};
}

export async function removePromoCode(checkoutId: string, promoCode: string): Promise<{ ok: boolean }> {
	const result = await executeGraphQL(CheckoutRemovePromoCodeDocument, {
		variables: { checkoutId, promoCode },
		cache: "no-cache",
	});
	const errors = result.checkoutRemovePromoCode?.errors ?? [];
	if (errors.length > 0) {
		return { ok: false };
	}
	revalidatePath("/", "layout");
	return { ok: true };
}
