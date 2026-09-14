import { type SelectHTMLAttributes, type ChangeEvent, type FocusEvent, type ReactNode } from "react";
import { useField } from "@/checkout/hooks/useForm/useField";

export interface Option<TData extends string = string> {
	label: ReactNode;
	value: TData;
	disabled?: boolean;
	icon?: ReactNode;
	[key: string]: unknown;
}

interface SelectProps<TName extends string, TData extends string>
	extends SelectHTMLAttributes<HTMLSelectElement> {
	name: TName;
	placeholder?: TName;
	label?: ReactNode;
	onChange?: (event: ChangeEvent<HTMLSelectElement>) => void;
	options: Option<TData>[];
}

export const Select = <TName extends string, TData extends string>({
	name,
	placeholder,
	onChange,
	onBlur,
	options,
	label,
	...rest
}: SelectProps<TName, TData>) => {
	const { error, handleBlur, ...fieldProps } = useField(name);

	// Derived from the value, never remembered: whenever the value is empty an
	// empty option must exist and be selected. Without one, the browser falls
	// back to displaying the FIRST real option (e.g. "Abu Dhabi") while the
	// form value stays "" — a selection the customer sees but never made, and
	// can't "re-select" because choosing the displayed option fires no change.
	const hasValue = fieldProps.value !== undefined && fieldProps.value !== null && fieldProps.value !== "";

	// Handlers passed in (e.g. AddressForm's autosave handlers) replace the
	// form-context ones, same as TextInput — the old `onBlur={handleBlur}` placed
	// after `{...rest}` silently dropped a passed onBlur.
	const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
		if (!event.currentTarget.value) {
			return;
		}

		(onChange ?? fieldProps.onChange)(event);
	};

	const handleSelectBlur = (event: FocusEvent<HTMLSelectElement>) => {
		(onBlur ?? handleBlur)(event);
	};

	return (
		<div className="space-y-0.5">
			<label className="flex flex-col">
				<span className="text-xs text-neutral-600">{label}</span>
				<select
					{...fieldProps}
					{...rest}
					value={hasValue ? (fieldProps.value as string) : ""}
					onBlur={handleSelectBlur}
					onChange={handleChange}
					className="mt-1 block w-full rounded-md border-neutral-200 shadow-sm focus:border-[#2d6a4f] focus:ring focus:ring-[#2d6a4f] focus:ring-opacity-30"
				>
					{!hasValue && (
						<option disabled value="">
							{placeholder ?? label ?? ""}
						</option>
					)}
					{options.map(({ label, value, disabled = false }) => (
						<option value={value} disabled={disabled} key={label?.toString() + "_" + value}>
							{label}
						</option>
					))}
				</select>
			</label>
			{error && <p className="text-sm text-red-600">{error}</p>}
		</div>
	);
};
