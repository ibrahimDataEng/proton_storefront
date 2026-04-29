// Locale-level 404. Triggered by bad-locale guard in [locale]/layout.tsx.
// When that layout throws notFound(), this renders ABOVE the layout —
// next-intl provider is NOT yet established. Hardcoded bilingual strings.
// Hardcoded colors: same palette as root not-found.

import Link from "next/link";

export default function LocaleNotFound() {
	return (
		<>
			<style>{`
        @keyframes pulse404locale {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.45; }
        }
        .nf-locale-pulse { animation: pulse404locale 2.8s ease-in-out infinite; }
      `}</style>
			<div
				style={{
					minHeight: "100vh",
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					backgroundColor: "#FAF7F2",
					fontFamily: "system-ui, -apple-system, sans-serif",
					padding: "2rem",
					textAlign: "center",
					gap: "1rem",
				}}
			>
				<p
					className="nf-locale-pulse"
					style={{
						fontSize: "5rem",
						fontWeight: 800,
						color: "#2D3B2E",
						opacity: 0.18,
						lineHeight: 1,
						margin: 0,
						letterSpacing: "-0.05em",
					}}
				>
					404
				</p>

				<h1
					style={{
						fontSize: "1.375rem",
						fontWeight: 600,
						color: "#1A1F1A",
						margin: 0,
					}}
				>
					الصفحة غير موجودة | Page Not Found
				</h1>

				<p
					style={{
						color: "#5C6158",
						maxWidth: "30rem",
						lineHeight: 1.65,
						margin: 0,
					}}
				>
					عذراً، لا يمكننا إيجاد هذه الصفحة
					<br />
					Sorry, we couldn&apos;t find this page
				</p>

				<p
					style={{
						color: "#8B7355",
						fontSize: "0.8125rem",
						maxWidth: "28rem",
						lineHeight: 1.6,
						margin: 0,
					}}
				>
					يرجى التحقق من الرابط أو العودة للصفحة الرئيسية
					<br />
					If you expected this page to exist, please check the URL
				</p>

				<Link
					href="/"
					style={{
						display: "inline-flex",
						alignItems: "center",
						justifyContent: "center",
						padding: "0.625rem 1.5rem",
						backgroundColor: "#2D3B2E",
						color: "#FAF7F2",
						borderRadius: "0.5rem",
						fontWeight: 500,
						fontSize: "0.875rem",
						textDecoration: "none",
						marginTop: "0.5rem",
					}}
				>
					العودة للرئيسية | Go Home
				</Link>
			</div>
		</>
	);
}
