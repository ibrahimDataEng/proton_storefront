import React from "react";
import { SelectBox, type SelectBoxProps } from "@/checkout/components/SelectBox";
import { Button } from "@/checkout/components/Button";
import { Address } from "@/checkout/components/Address";
import { type AddressField } from "@/checkout/components/AddressForm/types";
import { type AddressFragment } from "@/checkout/graphql";
import { useCheckoutMessages } from "@/checkout/lib/checkoutMessages";
import { EditIcon } from "@/checkout/assets/icons";

interface AddressSelectBoxProps<TFieldName extends string>
	extends Omit<SelectBoxProps<TFieldName>, "children"> {
	address: Partial<Record<AddressField, unknown>>;
	onEdit: () => void;
	unavailable: boolean;
}

export const AddressSelectBox = <TFieldName extends string>({
	address,
	onEdit,
	unavailable,
	...rest
}: AddressSelectBoxProps<TFieldName>) => {
	const { address: addressMessages } = useCheckoutMessages();

	return (
		<SelectBox {...rest} disabled={unavailable}>
			<div className="flex w-full flex-col justify-between pe-8">
				<Address address={address as AddressFragment}>
					{unavailable && <p className="font-xs my-1">{addressMessages.cantShipToAddress}</p>}
				</Address>
				<Button
					variant="tertiary"
					onClick={(event) => {
						event.stopPropagation();
						onEdit();
					}}
					ariaLabel={addressMessages.editAddress}
					className="s pointer-events-auto absolute right-2 top-2 h-6 w-6 p-0"
					label={<EditIcon />}
				/>
			</div>
		</SelectBox>
	);
};
