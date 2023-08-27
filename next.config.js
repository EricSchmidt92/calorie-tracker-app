/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */

const withPWA = require('next-pwa')({
	dest: 'public',
	register: true,
	skipWaiting: false,
	scope: process.env.NEXTAUTH_URL,
	disable: false,
	// disable: process.env.NODE_ENV === 'development',
});
module.exports = withPWA({ reactStrictMode: true });
