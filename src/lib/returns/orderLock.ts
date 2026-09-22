/**
 * Per-order in-process mutex for the return-flow server actions.
 *
 * Saleor's updateMetadata has no compare-and-set, so two concurrent actions on
 * the same order (two admin tabs approving at once, a double-tapped submit)
 * could both read "requested", both write, and both send an email. Every return
 * action runs its read → verify → write → email sequence inside this lock, so
 * the second caller always re-reads the state the first one wrote and is
 * refused (or finds its email already recorded).
 *
 * Scope: one Node process. Production runs a single standalone container
 * (docker-compose.server.yml), so that covers every request there. If the
 * storefront is ever scaled to multiple instances this needs a shared lock
 * (e.g. Redis) — the state re-check still refuses stale transitions, but a
 * true cross-instance race could then send one duplicate email.
 */
const tails = new Map<string, Promise<void>>();

export async function withOrderLock<T>(orderId: string, fn: () => Promise<T>): Promise<T> {
	const previous = tails.get(orderId) ?? Promise.resolve();
	let release: () => void = () => {};
	const current = new Promise<void>((resolve) => {
		release = resolve;
	});
	const tail = previous.then(() => current);
	tails.set(orderId, tail);

	try {
		await previous;
		return await fn();
	} finally {
		release();
		if (tails.get(orderId) === tail) tails.delete(orderId);
	}
}
