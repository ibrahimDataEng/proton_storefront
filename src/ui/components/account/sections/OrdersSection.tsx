"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { ChevronDown, ShoppingBag } from "lucide-react";
import { clsx } from "clsx";
import { EmptyState } from "@/ui/components/EmptyState";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";
import type { OrderDetailsFragment } from "@/gql/graphql";
import { formatMoney } from "@/lib/utils";

const INITIAL_COUNT = 5;
const PAGE_SIZE = 5;

interface Props {
	orders: OrderDetailsFragment[];
	locale: string;
}

function formatDate(dateStr: string, locale: string) {
	return new Intl.DateTimeFormat(locale === "ar" ? "ar-AE" : "en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
	}).format(new Date(dateStr));
}

function statusStyles(status: string | null | undefined) {
	switch (status) {
		case "FULFILLED":
			return "bg-green-100 text-green-700";
		case "CANCELLED":
			return "bg-red-100 text-red-600";
		case "PARTIALLY_FULFILLED":
			return "bg-amber-100 text-amber-700";
		default:
			return "bg-surface-sunken text-content-secondary";
	}
}

function OrderCard({ order, locale }: { order: OrderDetailsFragment; locale: string }) {
	const t = useTranslations("account");
	const [expanded, setExpanded] = useState(false);

	const thumbnails = order.lines
		.map((l) => l.variant?.product?.thumbnail)
		.filter(Boolean)
		.slice(0, 3);
	const extra = order.lines.length - 3;

	const total = order.total?.gross;

	return (
		<div className="rounded-2xl bg-surface-base ring-1 ring-line-subtle">
			<div className="flex flex-col gap-3 p-5">
				{/* Header row */}
				<div className="flex items-start justify-between gap-2">
					<div>
						<span className="font-mono text-xs text-content-secondary">#{order.number}</span>
						<p className="text-xs text-content-secondary">{formatDate(order.created , locale)}</p>
					</div>
					<div className="flex flex-col items-end gap-1">
						{order.status && (
							<span
								className={clsx("rounded-full px-2 py-0.5 text-xs font-semibold", statusStyles(order.status))}
							>
								{order.status.replace(/_/g, " ")}
							</span>
						)}
						{total && (
							<span className="text-sm font-semibold text-content-primary">
								{formatMoney(total.amount, total.currency)}
							</span>
						)}
					</div>
				</div>

				{/* Thumbnails */}
				{thumbnails.length > 0 && (
					<div className="flex items-center gap-1">
						{thumbnails.map((thumb, i) =>
							thumb ? (
								<img
									key={i}
									src={thumb.url}
									alt={thumb.alt ?? ""}
									className="h-10 w-10 rounded-lg object-cover ring-1 ring-line-subtle"
								/>
							) : null,
						)}
						{extra > 0 && (
							<span className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-sunken text-xs font-semibold text-content-secondary ring-1 ring-line-subtle">
								+{extra}
							</span>
						)}
					</div>
				)}

				{/* Toggle */}
				<button
					type="button"
					onClick={() => setExpanded((v) => !v)}
					className="flex items-center gap-1 self-start text-xs font-medium text-brand-primary hover:underline"
				>
					{t("viewDetails")}
					<ChevronDown
						className={clsx("h-3.5 w-3.5 transition-transform", expanded && "rotate-180")}
						aria-hidden="true"
					/>
				</button>
			</div>

			{/* Accordion */}
			<AnimatePresence initial={false}>
				{expanded && (
					<motion.div
						key="details"
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: "auto", opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						transition={{ duration: 0.25 }}
						className="overflow-hidden border-t border-line-subtle"
					>
						<ul className="flex flex-col gap-3 p-5">
							{order.lines.map((line, i) => {
								const product = line.variant?.product;
								const linePrice = line.variant?.pricing?.price?.gross;
								return (
									<li key={i} className="flex items-start gap-3">
										{product?.thumbnail && (
											<img
												src={product.thumbnail.url}
												alt={product.thumbnail.alt ?? product.name}
												className="h-12 w-12 rounded-lg object-cover"
											/>
										)}
										<div className="min-w-0 flex-1">
											<p className="text-sm font-medium text-content-primary">{product?.name}</p>
											{line.variant?.name && (
												<p className="text-xs text-content-secondary">{line.variant.name}</p>
											)}
											<p className="text-xs text-content-secondary">
												{t("qty")}: {line.quantity}
											</p>
										</div>
										{linePrice && (
											<p className="text-sm font-semibold text-content-primary">
												{formatMoney(linePrice.amount * line.quantity, linePrice.currency)}
											</p>
										)}
									</li>
								);
							})}
						</ul>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}

export function OrdersSection({ orders, locale }: Props) {
	const t = useTranslations("account");
	const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);

	if (orders.length === 0) {
		return (
			<EmptyState
				icon={<ShoppingBag className="h-12 w-12" />}
				title={t("noOrders")}
				subtitle={t("noOrdersSubtitle")}
				action={
					<LinkWithChannel
						href="/products"
						className="rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-semibold text-content-inverse transition-colors hover:bg-brand-primary/90"
					>
						{t("shopNow")}
					</LinkWithChannel>
				}
			/>
		);
	}

	const visible = orders.slice(0, visibleCount);
	const hasMore = visibleCount < orders.length;

	return (
		<div className="flex flex-col gap-4">
			{visible.map((order) => (
				<OrderCard key={order.id} order={order} locale={locale} />
			))}
			{hasMore && (
				<button
					type="button"
					onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
					className="mt-2 self-center rounded-xl bg-surface-base px-6 py-2.5 text-sm font-medium text-content-primary ring-1 ring-line-subtle transition-colors hover:bg-surface-sunken"
				>
					{t("loadMore")}
				</button>
			)}
		</div>
	);
}
