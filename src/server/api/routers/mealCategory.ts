import { createTRPCRouter, protectedProcedure } from '../trpc';

export const mealCategoryRouter = createTRPCRouter({
	getAll: protectedProcedure.query(async ({ ctx: { prisma } }) => {
		return prisma.mealCategory.findMany({
			select: {
				type: true,
				id: true,
			},
		});
	}),
});
