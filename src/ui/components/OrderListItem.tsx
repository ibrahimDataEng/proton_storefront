import Image from "next/image";
import { LinkWithChannel } from "../atoms/LinkWithChannel";
import { formatDate, formatMoney, getHrefForVariant } from "@/lib/utils";
import { type OrderDetailsFragment } from "@/gql/graphql";
import { PaymentStatus } from "@/ui/components/PaymentStatus";

type Props = {
	order: OrderDetailsFragment;
};

export const OrderListItem = ({ order }: Props) => {
	return (
		<li className="bg-surface-base">
			<div className="flex flex-col gap-2 border border-line-subtle bg-line-subtle/20 px-6 py-4 md:grid md:grid-cols-4 md:gap-8">
				<dl className="flex flex-col divide-y divide-line-subtle text-sm md:col-span-3 md:grid md:grid-cols-3 md:gap-6 md:divide-none lg:col-span-2">
					<div className="flex flex-row items-center justify-between py-4 md:flex-col md:items-start md:gap-y-1">
						<dt className="font-medium text-content-primary">Order number</dt>
						<dd className="text-content-secondary">{order.number}</dd>
					</div>
					<div className="flex flex-row items-center justify-between py-4 md:flex-col md:items-start md:gap-y-1">
						<dt className="font-medium text-content-primary">Date placed</dt>
						<dd className="text-content-secondary">
							<time dateTime={order.created}>{formatDate(new Date(order.created))}</time>
						</dd>
					</div>
					<div className="flex flex-row items-center justify-between py-4 md:flex-col md:items-start md:gap-y-1">
						<dt className="font-medium text-content-primary">Payment status</dt>
						<dd>
							<PaymentStatus status={order.paymentStatus} />
						</dd>
					</div>
				</dl>
				{/* TODO: Reveal after implementing the order details page. */}
				{/* <div className="flex flex-col md:col-span-1 md:flex-row md:items-center lg:col-span-2">
					<LinkWithChannel
						href="#"
						className="flex items-center justify-center rounded border border-line-subtle bg-surface-raised px-4 py-2 text-sm hover:bg-surface-sunken focus:bg-surface-sunken md:ml-auto"
					>
						View Order
					</LinkWithChannel>
				</div> */}
			</div>

			{order.lines.length > 0 && (
				<>
					<div className="md:border-x md:px-6">
						<table className="w-full text-sm text-content-secondary">
							<thead className="sr-only">
								<tr>
									<td>product</td>
									<td className="max-md:hidden">quantity and unit price</td>
									<td>price</td>
								</tr>
							</thead>
							<tbody className="md:divide-y">
								{order.lines.map((item) => {
									if (!item.variant) {
										return null;
									}

									const product = item.variant.product;

									return (
										<tr key={product.id}>
											<td className="py-6 pr-6 md:w-[60%] lg:w-[70%]">
												<div className="flex flex-row items-center">
													{product.thumbnail && (
														<div className="mr-3 aspect-square h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-line-subtle bg-surface-sunken md:mr-6 md:h-24 md:w-24">
															<Image
																src={product.thumbnail.url}
																alt={product.thumbnail.alt ?? ""}
																width={200}
																height={200}
																className="h-full w-full object-contain object-center"
															/>
														</div>
													)}
													<div>
														<LinkWithChannel
															href={getHrefForVariant({
																productSlug: product.slug,
																variantId: item.variant.id,
															})}
															className="font-medium text-content-primary"
														>
															{product.name}
														</LinkWithChannel>
														{item.variant.name !== item.variant.id && Boolean(item.variant.name) && (
															<p className="mt-1">Variant: {item.variant.name}</p>
														)}
													</div>
												</div>
											</td>
											<td className="py-6 pr-6 max-md:hidden">
												{item.quantity} ×{" "}
												{item.variant.pricing?.price &&
													formatMoney(
														item.variant.pricing.price.gross.amount,
														item.variant.pricing.price.gross.currency,
													)}
											</td>
											<td className="py-6 text-end">
												<div className="flex flex-col gap-1 text-content-primary">
													{item.variant.pricing?.price &&
														formatMoney(
															item.variant.pricing.price.gross.amount * item.quantity,
															item.variant.pricing.price.gross.currency,
														)}
													{item.quantity > 1 && (
														<span className="text-xs md:hidden">
															{item.quantity} ×{" "}
															{item.variant.pricing?.price &&
																formatMoney(
																	item.variant.pricing.price.gross.amount,
																	item.variant.pricing.price.gross.currency,
																)}
														</span>
													)}
												</div>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
					<dl className="flex justify-between border-y border-line-subtle py-6 text-sm font-medium text-content-primary md:border md:px-6">
						<dt>Total amount including delivery</dt>
						<dd>{formatMoney(order.total.gross.amount, order.total.gross.currency)}</dd>
					</dl>
				</>
			)}
		</li>
	);
};
