/**
 * Returns true when the current pathname is one of the pages where the
 * top announcement bar should be shown (home, wholesale, products listing).
 * The pathname is /:locale/:channel/[...inner], so we extract the inner
 * path before comparing.
 */
export function isTopBarPath(pathname: string): boolean {
	const parts = pathname.split("/").filter(Boolean);
	// parts = ["en", "default-channel"] for home, ["en", "default-channel", "products"] etc.
	const innerPath = parts.length <= 2 ? "/" : "/" + parts.slice(2).join("/");
	return innerPath === "/" || innerPath === "/products" || innerPath === "/pages/wholesale";
}
