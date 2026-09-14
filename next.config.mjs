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
			},
			{
				protocol: 'https',
				hostname: 'images.unsplash.com',
			},
		],
	},
};

export default nextConfig;
