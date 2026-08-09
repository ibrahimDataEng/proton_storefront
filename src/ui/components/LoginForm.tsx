import { getServerAuthClient } from "@/app/[locale]/config";

export async function LoginForm() {
	return (
		<div className="mx-auto mt-16 w-full max-w-lg">
			<form
				className="rounded border p-8 shadow-md"
				action={async (formData) => {
					"use server";

					const email = formData.get("email")?.toString();
					const password = formData.get("password")?.toString();

					if (!email || !password) {
						throw new Error("Email and password are required");
					}

					const { data } = await (
						await getServerAuthClient()
					).signIn({ email, password }, { cache: "no-store" });

					if (data.tokenCreate.errors.length > 0) {
						// setErrors(data.tokenCreate.errors.map((error) => error.message));
						// setFormValues(DefaultValues);
					}
				}}
			>
				<div className="mb-2">
					<label className="sr-only" htmlFor="email">
						Email
					</label>
					<input
						type="email"
						name="email"
						placeholder="Email"
						className="w-full rounded border border-line-default bg-surface-sunken px-4 py-2"
					/>
				</div>
				<div className="mb-4">
					<label className="sr-only" htmlFor="password">
						Password
					</label>
					<input
						type="password"
						name="password"
						placeholder="Password"
						autoCapitalize="off"
						autoComplete="off"
						className="w-full rounded border border-line-default bg-surface-sunken px-4 py-2"
					/>
				</div>

				<button
					className="rounded bg-brand-primary px-4 py-2 text-content-inverse hover:bg-brand-muted"
					type="submit"
				>
					Log In
				</button>
			</form>
			<div></div>
		</div>
	);
}
