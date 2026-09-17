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
		<div className="space-y-1">
			<label className="flex flex-col">
				<span className="text-xs font-medium text-content-secondary">
					{label}
					{required && <span aria-hidden="true">*</span>}
				</span>
				<input
					required={required}
					spellCheck={false}
					{...field}
					{...props}
					className={clsx(
						"mt-1 w-full appearance-none rounded-lg border-line-default bg-surface-raised shadow-sm transition-colors focus:border-brand-primary focus:outline-none focus:ring focus:ring-brand-primary focus:ring-opacity-30 active:outline-none",
						{ "border-status-danger focus:border-status-danger focus:ring-status-danger/30": error },
						props.className,
					)}
				/>
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
