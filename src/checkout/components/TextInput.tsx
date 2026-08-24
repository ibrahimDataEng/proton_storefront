import { type AllHTMLAttributes } from "react";
import clsx from "clsx";
import { Field, type FieldProps } from "formik";

export interface TextInputProps<TName extends string> extends AllHTMLAttributes<HTMLInputElement> {
	name: TName;
	label: string;
}

export const TextInput = <TName extends string>(props: TextInputProps<TName>) => (
	<Field {...props} component={TextInputComponent} />
);

export const TextInputComponent = <TName extends string>({
	field,
	form: { touched, errors },
	label,
	required,
	...props
}: TextInputProps<TName> & FieldProps) => {
	const error = touched[field.name] ? (errors[field.name] as string) : undefined;

	return (
		<div className="space-y-0.5">
			<label className="flex flex-col">
				<span className="text-xs text-neutral-600">
					{label}
					{required && <span aria-hidden="true">*</span>}
				</span>
				<input
					required={required}
					spellCheck={false}
					{...field}
					{...props}
					className={clsx(
						"mt-0.5 w-full appearance-none rounded-md border-neutral-200 shadow-sm transition-colors focus:border-[#2d6a4f] focus:outline-none focus:ring focus:ring-[#2d6a4f] focus:ring-opacity-30 active:border-neutral-200 active:outline-none",
						{ "border-red-400": error },
						props.className,
					)}
				/>
			</label>
			{error && <p className="text-sm text-red-600">{error}</p>}
		</div>
	);
};
