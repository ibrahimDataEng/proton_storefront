import { SummarySkeleton } from "@/checkout/sections/Summary/SummarySkeleton";
import { Skeleton } from "@/checkout/components/Skeleton";

export const OrderConfirmationSkeleton = () => {
	return (
		<div className="page">
			<header>
				<Skeleton className="title mb-6 h-4 w-72" />
				<Skeleton />
				<Skeleton className="w-2/3" />
			</header>
			<main className="mt-8 grid grid-cols-1 gap-8 gap-x-12 lg:grid-cols-[1fr_380px] lg:items-start lg:gap-x-16">
				<div className="rounded-xl border border-line-subtle px-6 pb-4 pt-6">
					<div className="mb-10">
						<Skeleton variant="title" />
						<Skeleton />
					</div>
					<div className="mb-10">
						<Skeleton variant="title" />
						<Skeleton className="w-2/3" />
					</div>
					<div className="mb-10">
						<Skeleton variant="title" />
						<Skeleton className="w-3/4" />
					</div>
					<div className="mb-10">
						<Skeleton variant="title" />
						<Skeleton className="w-1/2" />
						<Skeleton className="w-1/4" />
						<Skeleton className="w-2/3" />
					</div>
					<div className="mb-10">
						<Skeleton variant="title" />
						<Skeleton className="w-1/2" />
						<Skeleton className="w-1/4" />
						<Skeleton className="w-2/3" />
					</div>
				</div>
				<SummarySkeleton />
			</main>
		</div>
	);
};
