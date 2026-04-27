"use server";

import { revalidatePath } from "next/cache";
import { executeGraphQL } from "@/lib/graphql";
import { CheckoutAddLineDocument, CheckoutDeleteLinesDocument } from "@/gql/graphql";
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
}: {
	variantId: string;
	channel: string;
}): Promise<{ ok: boolean; redirect: boolean }> {
	const checkoutId = await Checkout.getIdFromCookies(channel);
	if (!checkoutId) {
		return { ok: false, redirect: true };
	}
	const result = await executeGraphQL(CheckoutAddLineDocument, {
		variables: { id: checkoutId, productVariantId: variantId },
		cache: "no-cache",
	});
	const errors = result.checkoutLinesAdd?.errors ?? [];
	if (errors.length > 0) {
		return { ok: false, redirect: false };
	}
	revalidatePath("/", "layout");
	return { ok: true, redirect: false };
}
