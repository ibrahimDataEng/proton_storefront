import { type SelectHTMLAttributes, type ChangeEvent, type FocusEvent, type ReactNode } from "react";
import clsx from "clsx";
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
		<div className="space-y-1">
			<label className="flex flex-col">
				<span className="text-xs font-medium text-content-secondary">{label}</span>
				<select
					{...fieldProps}
					{...rest}
					value={hasValue ? (fieldProps.value as string) : ""}
					onBlur={handleSelectBlur}
					onChange={handleChange}
					className={clsx(
						"mt-1 block w-full rounded-lg border-line-default bg-surface-raised bg-[right_0.5rem_center] shadow-sm focus:border-brand-primary focus:ring focus:ring-brand-primary focus:ring-opacity-30 rtl:bg-[left_0.5rem_center]",
						{ "border-status-danger focus:border-status-danger focus:ring-status-danger/30": error },
					)}
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
			{error && (
				<p className="flex items-center gap-1 text-sm font-medium text-status-danger">
					<svg
						className="h-3.5 w-3.5 flex-shrink-0"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						strokeWidth={2}
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
						/>
					</svg>
					{error}
				</p>
			)}
		</div>
	);
};
