import Image from "next/image";
import { clsx } from "clsx";
import { LinkWithChannel } from "../atoms/LinkWithChannel";

const companyName = "Tawasi Plus";

// logo.png's natural size is 1536x1024 (3:2). width/height below match that
// ratio exactly so next/image reports correct intrinsic dimensions; the
// h-14 w-auto classes then scale it to fit the header without distortion.
export const Logo = ({ className }: { className?: string }) => {
	return (
		<div className="flex shrink-0 items-center">
			<LinkWithChannel aria-label={`${companyName} — homepage`} href="/">
				<Image
					src="/logo.png"
					alt={companyName}
					width={180}
					height={120}
					className={clsx("h-14 w-auto", className)}
					priority
				/>
			</LinkWithChannel>
		</div>
	);
};
