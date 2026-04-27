import { ShoppingCart } from "lucide-react";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";

interface AddToCartButtonProps {
	productSlug: string;
	label: string;
}

// TODO: When ProductListItem fragment includes defaultVariant.id, accept variantId prop
// and call the addLineToCheckout server action directly instead of navigating to the product page.
export function AddToCartButton({ productSlug, label }: AddToCartButtonProps) {
	return (
		<LinkWithChannel
			href={`/products/${productSlug}`}
			className="flex items-center justify-center gap-1.5 rounded-lg bg-brand-primary px-3 py-2 text-sm font-medium text-content-inverse transition-colors hover:bg-brand-primary/90"
		>
			<ShoppingCart size={14} aria-hidden="true" />
			{label}
		</LinkWithChannel>
	);
}
