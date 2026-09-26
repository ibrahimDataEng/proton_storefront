import { type CourierWorklistOrderFragment } from "@/gql/graphql";

/** Shared by the delivery card and the return-pickup card. */

export function toWhatsAppLink(phone: string): string {
	const digits = phone.replace(/[^\d]/g, "");
	return `https://wa.me/${digits}`;
}

export function formatAddressLines(address: CourierWorklistOrderFragment["shippingAddress"]): string[] {
	if (!address) return [];
	return [
		[address.streetAddress1, address.streetAddress2].filter(Boolean).join(", "),
		[address.city, address.countryArea].filter(Boolean).join(", "),
		address.country?.country,
	].filter((line): line is string => Boolean(line));
}

export function mapsLink(address: CourierWorklistOrderFragment["shippingAddress"]): string | null {
	if (!address) return null;
	const query = [address.streetAddress1, address.city, address.countryArea, address.country?.country]
		.filter(Boolean)
		.join(", ");
	if (!query) return null;
	return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
