import { type FallbackProps } from "react-error-boundary";
import { SaleorLogo } from "@/checkout/assets/images/SaleorLogo";
import { Button } from "@/checkout/components/Button";
import { ErrorContentWrapper } from "@/checkout/components/ErrorContentWrapper";
import { useCheckoutMessages } from "@/checkout/lib/checkoutMessages";

export const PageNotFound = ({ error }: Partial<FallbackProps>) => {
	const { notFound } = useCheckoutMessages();
	console.error(error);

	const goBack = () => history.back();

	return (
		<ErrorContentWrapper>
			<div className="mb-4 flex w-28 flex-col">
				<SaleorLogo />
			</div>
			<p>{notFound.description}</p>
			<Button
				ariaLabel={notFound.backToStore}
				onClick={goBack}
				variant="secondary"
				label={notFound.backToStore}
			/>
		</ErrorContentWrapper>
	);
};
