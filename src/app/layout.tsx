import type { Metadata, Viewport } from "next";
import "@/styles/globals.css";
import { siteConfig } from "@/../config/site";
import { SessionProvider } from "@/components/providers/SessionProvider";

export const metadata: Metadata = {
	title: {
		default: `UNO — ${siteConfig.description}`,
		template: "%s | UNO",
	},
	description: `Find verified rental properties in Nigeria. ${siteConfig.description}`,
	keywords: siteConfig.keywords,
	authors: [{ name: siteConfig.creator }],
	openGraph: {
		title: `UNO — ${siteConfig.description}`,
		description: `Find verified rental properties in Nigeria. Transparent and hassle-free.`,
		url: siteConfig.url,
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
	themeColor: "#B91C1C",
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
			<body className="min-h-screen bg-surface-secondary font-sans antialiased">
				<SessionProvider>{children}</SessionProvider>
			</body>
		</html>
	);
}
