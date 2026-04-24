import { Button } from "@/checkout/components/Button";
import { IconButton } from "@/checkout/components/IconButton";
import { useCheckoutMessages } from "@/checkout/lib/checkoutMessages";
import { TrashIcon } from "@/checkout/ui-kit/icons";

interface AddressFormActionsProps {
	onDelete?: () => void;
	onCancel: () => void;
	onSubmit: () => void;
	loading: boolean;
}

export const AddressFormActions: React.FC<AddressFormActionsProps> = ({
	onSubmit,
	onDelete,
	onCancel,
	loading,
}) => {
	const { address, payment } = useCheckoutMessages();

	return (
		<div className="flex flex-row justify-end gap-2">
			{onDelete && (
				<div className="flex">
					<IconButton ariaLabel={address.deleteAddress} onClick={onDelete} icon={<TrashIcon aria-hidden />} />
				</div>
			)}

			<Button ariaLabel={address.cancel} variant="secondary" onClick={onCancel} label={address.cancel} />
			{loading ? (
				<Button
					ariaDisabled
					ariaLabel={address.saveAddress}
					onClick={(e) => e.preventDefault()}
					label={payment.processingPayment}
				/>
			) : (
				<Button ariaLabel={address.saveAddress} onClick={onSubmit} label={address.saveAddress} />
			)}
		</div>
	);
};
