"use client";

import { motion } from "framer-motion";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";

export default function NotFound() {
	return (
		<div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-8 py-16 text-center">
			{/* Animated broken-box SVG illustration */}
			<motion.svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 120 120"
				className="mb-8 h-32 w-32 text-brand-muted"
				aria-hidden="true"
				initial={{ opacity: 0, scale: 0.8 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ duration: 0.5, ease: "easeOut" }}
			>
				{/* Box base */}
				<motion.rect
					x="20"
					y="55"
					width="80"
					height="50"
					rx="4"
					fill="currentColor"
					opacity="0.15"
					initial={{ pathLength: 0 }}
					animate={{ pathLength: 1 }}
					transition={{ duration: 0.6, delay: 0.2 }}
				/>
				{/* Box lid left */}
				<motion.path
					d="M20 55 L60 40 L60 55 Z"
					fill="currentColor"
					opacity="0.25"
					initial={{ opacity: 0 }}
					animate={{ opacity: 0.25 }}
					transition={{ delay: 0.4, duration: 0.3 }}
				/>
				{/* Box lid right — tilted open */}
				<motion.path
					d="M100 55 L60 40 L60 55 Z"
					fill="currentColor"
					opacity="0.4"
					initial={{ rotate: 0, originX: "60px", originY: "55px" }}
					animate={{ rotate: -35 }}
					transition={{ delay: 0.6, duration: 0.5, ease: "easeOut" }}
				/>
				{/* Question mark inside */}
				<motion.text
					x="60"
					y="90"
					textAnchor="middle"
					fontSize="28"
					fontWeight="bold"
					fill="currentColor"
					opacity="0.6"
					initial={{ opacity: 0, y: 100 }}
					animate={{ opacity: 0.6, y: 90 }}
					transition={{ delay: 0.7, duration: 0.4 }}
				>
					?
				</motion.text>
				{/* Stars/sparkles */}
				<motion.circle
					cx="25"
					cy="35"
					r="3"
					fill="currentColor"
					opacity="0.5"
					initial={{ opacity: 0 }}
					animate={{ opacity: [0, 0.5, 0] }}
					transition={{ delay: 0.8, duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
				/>
				<motion.circle
					cx="95"
					cy="30"
					r="2"
					fill="currentColor"
					opacity="0.4"
					initial={{ opacity: 0 }}
					animate={{ opacity: [0, 0.4, 0] }}
					transition={{ delay: 1.2, duration: 1.5, repeat: Infinity, repeatDelay: 1.2 }}
				/>
				<motion.circle
					cx="15"
					cy="70"
					r="2"
					fill="currentColor"
					opacity="0.3"
					initial={{ opacity: 0 }}
					animate={{ opacity: [0, 0.3, 0] }}
					transition={{ delay: 1.6, duration: 1.5, repeat: Infinity, repeatDelay: 0.8 }}
				/>
			</motion.svg>

			<motion.div
				initial={{ opacity: 0, y: 12 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.3, duration: 0.4 }}
				className="flex flex-col items-center gap-3"
			>
				<span className="text-6xl font-bold text-brand-muted opacity-30">404</span>
				<h1 className="text-2xl font-semibold text-content-primary">Product not found</h1>
				<p className="text-content-secondary">This product may have been removed or the link is incorrect.</p>
			</motion.div>

			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: 0.6, duration: 0.4 }}
				className="mt-8 flex gap-3"
			>
				<LinkWithChannel
					href="/products"
					className="inline-flex items-center justify-center rounded-lg bg-brand-primary px-5 py-2.5 text-sm font-medium text-content-inverse transition-colors hover:bg-brand-primary/90"
				>
					Browse products
				</LinkWithChannel>
				<LinkWithChannel
					href="/"
					className="inline-flex items-center justify-center rounded-lg border border-line-default px-5 py-2.5 text-sm font-medium text-content-secondary transition-colors hover:border-brand-primary hover:text-brand-primary"
				>
					Go home
				</LinkWithChannel>
			</motion.div>
		</div>
	);
}
