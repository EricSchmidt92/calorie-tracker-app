import { env } from '@/env.mjs';
import { prisma } from '@/server/db';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { type GetServerSidePropsContext } from 'next';
import { getServerSession, type DefaultSession, type NextAuthOptions } from 'next-auth';
import DiscordProvider from 'next-auth/providers/discord';

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module 'next-auth' {
	interface Session extends DefaultSession {
		user: DefaultSession['user'] & {
			id: string;
			// ...other properties
			// role: UserRole;
		};
	}

	// interface User {
	//   // ...other properties
	//   // role: UserRole;
	// }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authOptions: NextAuthOptions = {
	callbacks: {
		session: async ({ session, user }) => {
			const data = await prisma.goal.findFirst({
				where: {
					userId: user.id,
				},
			});

			if (!data) {
				await prisma.goal.upsert({
					create: {
						calorieLimit: 0,
						userId: user.id,
					},
					update: {},
					where: {
						userId: user.id,
					},
				});
			}

			return {
				...session,
				user: {
					...session.user,
					id: user.id,
				},
			};
		},
	},
	adapter: PrismaAdapter(prisma),
	providers: [
		DiscordProvider({
			clientId: env.DISCORD_CLIENT_ID,
			clientSecret: env.DISCORD_CLIENT_SECRET,
		}),
		// GoogleProvider({
		// 	clientId: env.GOOGLE_CLIENT_ID,
		// 	clientSecret: env.GOOGLE_CLIENT_SECRET,
		// }), //TODO: add back in once dev server is created
		/**
		 * ...add more providers here.
		 *
		 * Most other providers require a bit more work than the Discord provider. For example, the
		 * GitHub provider requires you to add the `refresh_token_expires_in` field to the Account
		 * model. Refer to the NextAuth.js docs for the provider you want to use. Example:
		 *
		 * @see https://next-auth.js.org/providers/github
		 */
	],
};

/**
 * Wrapper for `getServerSession` so that you don't need to import the `authOptions` in every file.
 *
 * @see https://next-auth.js.org/configuration/nextjs
 */
export const getServerAuthSession = (ctx: {
	req: GetServerSidePropsContext['req'];
	res: GetServerSidePropsContext['res'];
}) => {
	return getServerSession(ctx.req, ctx.res, authOptions);
};
