import React from "react";
import { useField } from "formik";
import { useFormContext } from "@/checkout/hooks/useForm";

interface CheckboxProps<TName extends string> {
	name: TName;
	label: string;
}

export const Checkbox = <TName extends string>({ name, label }: CheckboxProps<TName>) => {
	const { handleChange } = useFormContext<Record<TName, string>>();
	const [field, { value }] = useField<boolean>(name);

	return (
		<label className="inline-flex items-center gap-x-2">
			<input
				{...field}
				value={field.value as unknown as string}
				name={name}
				checked={value}
				onChange={(event) => {
					handleChange({ ...event, target: { ...event.target, name, value: !value } });
				}}
				type="checkbox"
				className="rounded border-neutral-300 text-[#2d6a4f] shadow-sm focus:border-[#2d6a4f] focus:ring focus:ring-[#2d6a4f] focus:ring-opacity-30 focus:ring-offset-0"
			/>
			<span>{label}</span>
		</label>
	);
};
