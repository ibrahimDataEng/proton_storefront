import { XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
type Props = {
	isAvailable: boolean;
};
const pClasses = "ml-1 text-sm font-semibold text-content-secondary";
export const AvailabilityMessage = ({ isAvailable }: Props) => {
	const t = useTranslations("availability");
	if (!isAvailable) {
		return (
			<div className="mt-6 flex items-center">
				<XIcon className="h-5 w-5 flex-shrink-0 text-status-danger" aria-hidden="true" />
				<p className={pClasses}>{t("outofstock")}</p>
			</div>
		);
	}
	return <></>;
};
