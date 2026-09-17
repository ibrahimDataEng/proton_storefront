import { CheckoutFormSkeleton } from "@/checkout/sections/CheckoutForm";
import { SummarySkeleton } from "@/checkout/sections/Summary";

export const CheckoutSkeleton = () => (
	<div className="px-4 lg:px-0">
		<div className="grid grid-cols-1 gap-8 gap-x-12 lg:grid-cols-[1fr_380px] lg:items-start lg:gap-x-16">
			<CheckoutFormSkeleton />
			<SummarySkeleton />
		</div>
	</div>
);
