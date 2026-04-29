// Root-level 404. Renders before any locale layout is established.
// NO next-intl, NO framer-motion, NO CSS custom properties.
// Hardcoded colors: brand-primary #2D3B2E | surface-base #FAF7F2
//                  content-primary #1A1F1A | content-secondary #5C6158

export default function NotFound() {
	return (
		<>
			<style>{`
        @keyframes pulse404 {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.45; }
        }
        .nf-root-pulse { animation: pulse404 2.8s ease-in-out infinite; }
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
					className="nf-root-pulse"
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

				<a
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
				</a>
			</div>
		</>
	);
}
