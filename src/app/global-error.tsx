"use client";

// Root layout error boundary. Renders INSTEAD of the root layout,
// so it must provide its own <html> and <body>.
// NO next-intl, NO framer-motion, NO CSS custom properties.
// Hardcoded colors: status-warning #A67C3C | brand-primary #2D3B2E
//                  surface-base #FAF7F2 | content-primary #1A1F1A
//                  content-secondary #5C6158 | line-default #D2CDC4

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
	useEffect(() => {
		console.error(error);
	}, [error]);

	return (
		<html lang="ar" dir="rtl">
			<body
				style={{
					margin: 0,
					backgroundColor: "#FAF7F2",
					fontFamily: "system-ui, -apple-system, sans-serif",
				}}
			>
				<style>{`
          @keyframes drawLineGE {
            from { stroke-dashoffset: 80; opacity: 0; }
            to   { stroke-dashoffset: 0;  opacity: 1; }
          }
          .ge-x-1 {
            stroke-dasharray: 80;
            animation: drawLineGE 0.45s ease-out 0.3s forwards;
            opacity: 0;
          }
          .ge-x-2 {
            stroke-dasharray: 80;
            animation: drawLineGE 0.45s ease-out 0.5s forwards;
            opacity: 0;
          }
          @keyframes fadeInGE {
            from { opacity: 0; transform: translateY(8px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          .ge-content {
            animation: fadeInGE 0.4s ease-out 0.2s both;
          }
          .ge-btn:hover { opacity: 0.85; }
          .ge-link:hover { border-color: #2D3B2E; color: #2D3B2E; }
        `}</style>

				<div
					style={{
						minHeight: "100vh",
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						justifyContent: "center",
						padding: "2rem",
						textAlign: "center",
						gap: "1rem",
					}}
				>
					{/* Animated X-in-circle icon */}
					<svg
						viewBox="0 0 120 120"
						style={{ width: "7rem", height: "7rem", color: "#A67C3C", marginBottom: "0.5rem" }}
						aria-hidden="true"
					>
						<circle cx="60" cy="60" r="48" fill="currentColor" opacity="0.08" />
						<circle cx="60" cy="60" r="48" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.35" />
						<line
							className="ge-x-1"
							x1="38"
							y1="38"
							x2="82"
							y2="82"
							stroke="currentColor"
							strokeWidth="3.5"
							strokeLinecap="round"
						/>
						<line
							className="ge-x-2"
							x1="82"
							y1="38"
							x2="38"
							y2="82"
							stroke="currentColor"
							strokeWidth="3.5"
							strokeLinecap="round"
						/>
					</svg>

					<div className="ge-content" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
						<h1 style={{ fontSize: "1.375rem", fontWeight: 600, color: "#1A1F1A", margin: 0 }}>
							حدث خطأ غير متوقع | Unexpected Error
						</h1>
						<p style={{ color: "#5C6158", maxWidth: "28rem", lineHeight: 1.65, margin: 0 }}>
							يرجى المحاولة مرة أخرى | Please try again
						</p>

						{error.message && (
							<code
								style={{
									display: "block",
									marginTop: "0.5rem",
									padding: "0.5rem 0.875rem",
									backgroundColor: "#F5F1EA",
									borderRadius: "0.375rem",
									fontSize: "0.75rem",
									color: "#5C6158",
									maxWidth: "28rem",
									wordBreak: "break-all",
								}}
							>
								{error.message}
							</code>
						)}
					</div>

					<div
						style={{
							display: "flex",
							gap: "0.75rem",
							marginTop: "0.75rem",
							flexWrap: "wrap",
							justifyContent: "center",
						}}
					>
						<button
							type="button"
							onClick={reset}
							className="ge-btn"
							style={{
								padding: "0.625rem 1.5rem",
								backgroundColor: "#2D3B2E",
								color: "#FAF7F2",
								border: "none",
								borderRadius: "0.5rem",
								fontWeight: 500,
								fontSize: "0.875rem",
								cursor: "pointer",
								transition: "opacity 0.15s",
							}}
						>
							المحاولة مرة أخرى | Try Again
						</button>
						<a
							href="/"
							className="ge-link"
							style={{
								display: "inline-flex",
								alignItems: "center",
								padding: "0.625rem 1.5rem",
								border: "1px solid #D2CDC4",
								color: "#5C6158",
								borderRadius: "0.5rem",
								fontWeight: 500,
								fontSize: "0.875rem",
								textDecoration: "none",
								transition: "border-color 0.15s, color 0.15s",
							}}
						>
							العودة للرئيسية | Go Home
						</a>
					</div>
				</div>
			</body>
		</html>
	);
}
