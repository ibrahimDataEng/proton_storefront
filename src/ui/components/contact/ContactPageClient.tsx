"use client";

import { type FormEvent, type ReactNode, useRef, useState } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { useTranslations } from "next-intl";
import { Mail, Phone, MapPin, Clock, Send, CheckCircle, Loader2 } from "lucide-react";
import { clsx } from "clsx";
import { Container } from "@/ui/components/Container";

type FormStatus = "idle" | "sending" | "sent";

interface FormState {
	name: string;
	email: string;
	subject: string;
	message: string;
}

const containerVariants = {
	hidden: {},
	visible: { transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
	hidden: { opacity: 0, y: 28, scale: 0.97 },
	visible: {
		opacity: 1,
		y: 0,
		scale: 1,
		transition: { type: "spring" as const, stiffness: 280, damping: 24 },
	},
};

const formItemVariants = {
	hidden: { opacity: 0, x: -12 },
	visible: {
		opacity: 1,
		x: 0,
		transition: { type: "spring" as const, stiffness: 300, damping: 28 },
	},
};

interface ContactCardProps {
	icon: ReactNode;
	label: string;
	value: string;
	href: string | null;
}

function ContactCard({ icon, label, value, href }: ContactCardProps) {
	return (
		<motion.div
			variants={itemVariants}
			whileHover={{ y: -4, transition: { type: "spring", stiffness: 400, damping: 25 } }}
			className="group relative overflow-hidden rounded-xl border border-line-subtle bg-surface-raised p-5 shadow-soft transition-shadow hover:shadow-raised"
		>
			<div className="absolute inset-y-0 left-0 w-1 origin-center scale-y-0 rounded-l-xl bg-brand-primary transition-transform duration-200 group-hover:scale-y-100 rtl:left-auto rtl:right-0 rtl:rounded-l-none rtl:rounded-r-xl" />
			<div className="flex items-start gap-4 pl-2 rtl:pl-0 rtl:pr-2">
				<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary">
					{icon}
				</div>
				<div className="min-w-0 flex-1">
					<p className="mb-1 text-xs font-medium uppercase tracking-wider text-content-secondary">{label}</p>
					{href ? (
						<a
							href={href}
							className="break-all font-medium text-content-primary transition-colors hover:text-brand-primary"
						>
							{value}
						</a>
					) : (
						<p className="font-medium text-content-primary">{value}</p>
					)}
				</div>
			</div>
		</motion.div>
	);
}

export function ContactPageClient() {
	const t = useTranslations("contact");
	const [form, setForm] = useState<FormState>({ name: "", email: "", subject: "", message: "" });
	const [status, setStatus] = useState<FormStatus>("idle");
	const [errors, setErrors] = useState<Partial<FormState>>({});

	const heroRef = useRef(null);
	const cardsRef = useRef(null);
	const formRef = useRef(null);

	const heroInView = useInView(heroRef, { once: true });
	const cardsInView = useInView(cardsRef, { once: true, amount: 0.1 });
	const formInView = useInView(formRef, { once: true, amount: 0.1 });

	const cards = [
		{
			id: "email",
			icon: <Mail className="h-5 w-5" />,
			label: t("emailLabel"),
			value: t("emailValue"),
			href: `mailto:${t("emailValue")}`,
		},
		{
			id: "phone",
			icon: <Phone className="h-5 w-5" />,
			label: t("phoneLabel"),
			value: t("phoneValue"),
			href: `tel:${t("phoneValue").replace(/\s/g, "")}`,
		},
		{
			id: "address",
			icon: <MapPin className="h-5 w-5" />,
			label: t("addressLabel"),
			value: t("addressValue"),
			href: null,
		},
		{
			id: "hours",
			icon: <Clock className="h-5 w-5" />,
			label: t("hoursLabel"),
			value: t("hoursValue"),
			href: null,
		},
	];

	const validate = (): Partial<FormState> => {
		const errs: Partial<FormState> = {};
		if (!form.name.trim()) errs.name = t("required");
		if (!form.email.trim()) {
			errs.email = t("required");
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
			errs.email = t("invalidEmail");
		}
		if (!form.subject.trim()) errs.subject = t("required");
		if (!form.message.trim()) errs.message = t("required");
		return errs;
	};

	const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const errs = validate();
		if (Object.keys(errs).length > 0) {
			setErrors(errs);
			return;
		}
		setErrors({});
		setStatus("sending");
		await new Promise<void>((res) => setTimeout(res, 1500));
		setStatus("sent");
		setTimeout(() => {
			setStatus("idle");
			setForm({ name: "", email: "", subject: "", message: "" });
		}, 5000);
	};

	const inputClass = (hasError: boolean) =>
		clsx(
			"w-full rounded-lg border px-4 py-3 text-content-primary placeholder:text-content-secondary/50",
			"bg-surface-base outline-none transition-colors",
			"focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20",
			hasError ? "border-red-400" : "border-line-default",
		);

	return (
		<Container className="py-12 md:py-16">
			{/* Hero */}
			<motion.div
				ref={heroRef}
				initial={{ opacity: 0, y: 20 }}
				animate={heroInView ? { opacity: 1, y: 0 } : {}}
				transition={{ duration: 0.5, ease: "easeOut" }}
				className="mb-12 text-center"
			>
				<h1 className="text-4xl font-bold tracking-tight text-content-primary md:text-5xl">{t("title")}</h1>
				<p className="mt-3 text-lg text-content-secondary">{t("subtitle")}</p>
				<motion.div
					initial={{ scaleX: 0 }}
					animate={heroInView ? { scaleX: 1 } : {}}
					transition={{ delay: 0.3, duration: 0.4, ease: "easeOut" }}
					style={{ transformOrigin: "center" }}
					className="mx-auto mt-5 h-1 w-16 rounded-full bg-brand-primary"
				/>
			</motion.div>

			{/* Two-column layout */}
			<div className="grid gap-8 lg:grid-cols-[2fr_3fr] lg:gap-12">
				{/* Contact info cards */}
				<motion.div
					ref={cardsRef}
					variants={containerVariants}
					initial="hidden"
					animate={cardsInView ? "visible" : "hidden"}
					className="flex flex-col gap-4"
				>
					{cards.map((card) => (
						<ContactCard key={card.id} {...card} />
					))}
				</motion.div>

				{/* Contact form */}
				<div ref={formRef}>
					<motion.div
						variants={itemVariants}
						initial="hidden"
						animate={formInView ? "visible" : "hidden"}
						className="rounded-2xl border border-line-subtle bg-surface-raised p-6 shadow-soft md:p-8"
					>
						<h2 className="mb-6 text-2xl font-semibold text-content-primary">{t("formTitle")}</h2>

						<motion.form
							variants={containerVariants}
							initial="hidden"
							animate={formInView ? "visible" : "hidden"}
							onSubmit={handleSubmit}
							noValidate
							className="flex flex-col gap-5"
						>
							{/* Name */}
							<motion.div variants={formItemVariants}>
								<label className="mb-1.5 block text-sm font-medium text-content-primary">
									{t("nameLabel")}
								</label>
								<input
									type="text"
									dir="auto"
									value={form.name}
									onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
									placeholder={t("namePlaceholder")}
									className={inputClass(!!errors.name)}
								/>
								{errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
							</motion.div>

							{/* Email */}
							<motion.div variants={formItemVariants}>
								<label className="mb-1.5 block text-sm font-medium text-content-primary">
									{t("emailFieldLabel")}
								</label>
								<input
									type="email"
									dir="auto"
									value={form.email}
									onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
									placeholder={t("emailPlaceholder")}
									className={inputClass(!!errors.email)}
								/>
								{errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
							</motion.div>

							{/* Subject */}
							<motion.div variants={formItemVariants}>
								<label className="mb-1.5 block text-sm font-medium text-content-primary">
									{t("subjectLabel")}
								</label>
								<input
									type="text"
									dir="auto"
									value={form.subject}
									onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
									placeholder={t("subjectPlaceholder")}
									className={inputClass(!!errors.subject)}
								/>
								{errors.subject && <p className="mt-1 text-xs text-red-500">{errors.subject}</p>}
							</motion.div>

							{/* Message */}
							<motion.div variants={formItemVariants}>
								<label className="mb-1.5 block text-sm font-medium text-content-primary">
									{t("messageLabel")}
								</label>
								<textarea
									dir="auto"
									rows={5}
									value={form.message}
									onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
									placeholder={t("messagePlaceholder")}
									className={clsx(inputClass(!!errors.message), "resize-none")}
								/>
								{errors.message && <p className="mt-1 text-xs text-red-500">{errors.message}</p>}
							</motion.div>

							{/* Submit */}
							<motion.div variants={formItemVariants}>
								<button
									type="submit"
									disabled={status === "sending" || status === "sent"}
									className={clsx(
										"inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg px-6 font-medium transition-all duration-300",
										"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base",
										"disabled:pointer-events-none",
										status === "sent"
											? "bg-green-600 text-white"
											: "bg-brand-primary text-content-inverse hover:bg-brand-primary/90",
									)}
								>
									<AnimatePresence mode="wait" initial={false}>
										{status === "sending" ? (
											<motion.span
												key="sending"
												initial={{ opacity: 0, y: 8 }}
												animate={{ opacity: 1, y: 0 }}
												exit={{ opacity: 0, y: -8 }}
												className="flex items-center gap-2"
											>
												<Loader2 className="h-4 w-4 animate-spin" />
												{t("sending")}
											</motion.span>
										) : status === "sent" ? (
											<motion.span
												key="sent"
												initial={{ opacity: 0, scale: 0.8 }}
												animate={{ opacity: 1, scale: 1 }}
												exit={{ opacity: 0 }}
												className="flex items-center gap-2"
											>
												<CheckCircle className="h-4 w-4" />
												{t("sent")}
											</motion.span>
										) : (
											<motion.span
												key="idle"
												initial={{ opacity: 0, y: -8 }}
												animate={{ opacity: 1, y: 0 }}
												exit={{ opacity: 0, y: 8 }}
												className="flex items-center gap-2"
											>
												<Send className="h-4 w-4" />
												{t("submit")}
											</motion.span>
										)}
									</AnimatePresence>
								</button>
							</motion.div>

							{/* Success note */}
							<AnimatePresence>
								{status === "sent" && (
									<motion.p
										initial={{ opacity: 0, y: 8 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: -8 }}
										className="text-center text-sm text-content-secondary"
									>
										{t("sentSubtitle")}
									</motion.p>
								)}
							</AnimatePresence>
						</motion.form>
					</motion.div>
				</div>
			</div>
		</Container>
	);
}
