"use client";

import { useTranslations } from "next-intl";
import { Phone, MapPin } from "lucide-react";
import { formatAddressLines, mapsLink, toWhatsAppLink } from "./courierAddress";
import { type CourierWorklistOrderFragment } from "@/gql/graphql";

/** Tap-to-call + WhatsApp phone and shipping address with a Maps link — shared by delivery and return-pickup cards. */
export function CourierCustomerContact({
	address,
}: {
	address: CourierWorklistOrderFragment["shippingAddress"];
}) {
	const t = useTranslations("courier");
	const phone = address?.phone;
	const addressLines = formatAddressLines(address);
	const maps = mapsLink(address);

	return (
		<>
			{phone && (
				<div className="flex flex-wrap items-center gap-3 text-sm">
					<a
						href={`tel:${phone}`}
						dir="ltr"
						className="inline-flex items-center gap-1.5 font-medium text-content-primary hover:text-brand-primary"
					>
						<Phone className="h-4 w-4" aria-hidden="true" />
						{phone}
					</a>
					<a
						href={toWhatsAppLink(phone)}
						target="_blank"
						rel="noopener noreferrer"
						className="text-status-success underline-offset-2 hover:underline"
					>
						{t("whatsapp")}
					</a>
				</div>
			)}

			{addressLines.length > 0 && (
				<div className="flex items-start gap-1.5 text-sm text-content-secondary">
					<MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
					<div className="flex flex-col">
						{addressLines.map((line, i) => (
							<span key={i}>{line}</span>
						))}
						{maps && (
							<a
								href={maps}
								target="_blank"
								rel="noopener noreferrer"
								className="mt-1 text-brand-primary underline-offset-2 hover:underline"
							>
								{t("openInMaps")}
							</a>
						)}
					</div>
				</div>
			)}
		</>
	);
}
