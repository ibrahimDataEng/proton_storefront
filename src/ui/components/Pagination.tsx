import clsx from "clsx";
import { LinkWithChannel } from "../atoms/LinkWithChannel";

export async function Pagination({
	pageInfo,
}: {
	pageInfo: {
		basePathname: string;
		hasNextPage: boolean;
		readonly urlSearchParams?: URLSearchParams;
	};
}) {
	return (
		<nav className="flex items-center justify-center gap-x-4 px-4 pt-12">
			<LinkWithChannel
				href={pageInfo.hasNextPage ? `${pageInfo.basePathname}?${pageInfo.urlSearchParams?.toString()}` : "#"}
				className={clsx("px-4 py-2 text-sm font-medium ", {
					"rounded bg-brand-primary text-content-inverse hover:bg-brand-muted": pageInfo.hasNextPage,
					"cursor-not-allowed rounded border border-line-subtle text-content-secondary":
						!pageInfo.hasNextPage,
					"pointer-events-none": !pageInfo.hasNextPage,
				})}
				aria-disabled={!pageInfo.hasNextPage}
			>
				Next page
			</LinkWithChannel>
		</nav>
	);
}
