// Our Cloudinary account. The image optimizer (/_next/image) only fetches from
// this account's path, so it can't be fed files from anyone else's account —
// the delivery route for the critical optimizer advisories on Next 14 (TODO 42/43).
const cloudinaryCloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
if (!cloudinaryCloud) {
	console.warn(
		"[next.config] NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is not set — Cloudinary images are not pinned to our account."
	);
}

/** @type {import('next').NextConfig} */
const nextConfig = {
	// Emits .next/standalone (server.js + only the node_modules it needs) so the
	// Docker image stays small. Vercel ignores this setting.
	output: 'standalone',
	images: {
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'res.cloudinary.com',
				...(cloudinaryCloud && { pathname: `/${cloudinaryCloud}/**` }),
			},
			{
				protocol: 'https',
				hostname: 'images.unsplash.com',
			},
		],
	},
};

export default nextConfig;
