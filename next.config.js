/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
// await import('./src/env.mjs');
// import withPwa from 'next-pwa';
// import { InjectManifest } from 'workbox-webpack-plugin';
// import withWorkBox from 'next-with-workbox';
// import { WithPWA } from 'next-pwa';
/* @type {import("next").NextConfig} */
const withPWA = require('next-pwa')({
	dest: 'public',
	register: true,
	skipWaiting: false,
	scope: 'http://10.0.0.174:3000',
	disable: false, //process.env.NODE_ENV === 'development',
});
module.exports = withPWA({ reactStrictMode: true });

// const config = withWorkBox({
// 	// reactStrictMode: true,
// 	// webpack: (config, { dev }) => {
// 	// 	if (!dev) {
// 	// 		config.plugins.push(
// 	// 			new InjectManifest({
// 	// 				swSrc: './public/sw.mjs', // Path to your service worker file
// 	// 			})
// 	// 		);
// 	// 	}

// 	// 	return config;
// 	// },

// 	workbox: {
// 		webpack: (config, { dev }) => {
// 			if (!dev) {
// 				config.plugins.push(
// 					new InjectManifest({
// 						swSrc: './public/sw.mjs', // Path to your service worker file
// 					})
// 				);
// 			}

// 			return config;
// 		},
// 	},
// 	/**
// 	 * If you are using `appDir` then you must comment the below `i18n` config out.
// 	 *
// 	 * @see https://github.com/vercel/next.js/issues/41980
// 	 */
// 	i18n: {
// 		locales: ['en'],
// 		defaultLocale: 'en',
// 	},
// });

// export default config;
