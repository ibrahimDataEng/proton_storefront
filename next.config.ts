import { type NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
	async redirects() {
		return [
			{
				source: "/:locale/:channel/pages/contact",
				destination: "/:locale/:channel/pages/contact-us",
				permanent: true,
			},
		];
	},
	images: {
		remotePatterns: [
			{
				protocol: "http",
				hostname: "localhost",
				port: "8000",
				pathname: "/media/**",
			},
			{
				protocol: "http",
				hostname: "localhost",
				port: "8000",
				pathname: "/thumbnail/**",
			},
			{
				protocol: "https",
				hostname: "**",
			},
		],
	},
	experimental: {
		typedRoutes: false,
	},
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
