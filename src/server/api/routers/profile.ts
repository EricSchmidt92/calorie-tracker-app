import { createTRPCRouter, protectedProcedure } from '../trpc';

export const profileRouter = createTRPCRouter({
	getProfile: protectedProcedure.query(({ ctx: { prisma, session } }) => {
		return prisma.user.findUnique({
			select: {
				goals: true,
				name: true,
				email: true,
			},
			where: {
				id: session.user.id,
			},
		});
	}),
});
