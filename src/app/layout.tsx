import type { Metadata, Viewport } from "next";
import "@/styles/globals.css";
import { siteConfig } from "@/../config/site";
import { siteUrl } from "@/lib/site";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { CookieConsent } from "@/components/legal/CookieConsent";
import { EnvBanner } from "@/components/layout/EnvBanner";
import { envBannerLabel } from "@/lib/app-env";

export const metadata: Metadata = {
	metadataBase: new URL(siteUrl()),
	title: {
		default: `${siteConfig.name} — ${siteConfig.description}`,
		template: `%s | ${siteConfig.name}`,
	},
	description: `Find verified rental properties in Nigeria. ${siteConfig.description}`,
	keywords: siteConfig.keywords,
	authors: [{ name: siteConfig.creator }],
	openGraph: {
		title: `${siteConfig.name} — ${siteConfig.description}`,
		description: `Find verified rental properties in Nigeria. Transparent and hassle-free.`,
		url: siteUrl(),
		siteName: siteConfig.name,
		type: "website",
		locale: "en_NG",
	},
	twitter: {
		card: "summary_large_image",
		title: siteConfig.name,
		description: `Find verified rental properties in Nigeria.`,
	},
};

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	maximumScale: 1,
	userScalable: false,
	// Matches --color-brand in src/styles/tokens.css.
	themeColor: "#af2525",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<link rel="preconnect" href="https://fonts.googleapis.com" />
				<link
					rel="preconnect"
					href="https://fonts.gstatic.com"
					crossOrigin="anonymous"
				/>
			</head>
			<body
				className="min-h-screen bg-surface-secondary font-sans antialiased"
				// Height of <EnvBanner /> (h-6), so h-screen pages can subtract it.
				style={{ "--env-banner-h": envBannerLabel(process.env.NEXT_PUBLIC_APP_ENV) ? "1.5rem" : "0px" } as React.CSSProperties}
			>
				<EnvBanner />
				<SessionProvider>{children}</SessionProvider>
				<CookieConsent />
			</body>
		</html>
	);
}
