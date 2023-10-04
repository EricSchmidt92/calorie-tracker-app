import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';

export const goalsRouter = createTRPCRouter({
	updateGoals: protectedProcedure
		.input(
			z.object({
				goalWeight: z.number().optional(),
				calorieLimit: z.number().optional(),
			})
		)
		.mutation(({ input, ctx: { prisma, session } }) => {
			const { goalWeight, calorieLimit } = input;

			return prisma.goal.update({
				data: {
					goalWeight,
					calorieLimit,
				},
				where: {
					userId: session.user.id,
				},
			});
		}),
});
