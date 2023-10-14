import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';

export const goalsRouter = createTRPCRouter({
	updateGoals: protectedProcedure
		.input(
			z.object({
				goalWeight: z.number().optional(),
				calorieLimit: z.number().optional(),
				waterIntake: z.number().optional(),
			})
		)
		.mutation(({ input, ctx: { prisma, session } }) => {
			return prisma.goal.update({
				data: {
					...input,
				},
				where: {
					userId: session.user.id,
				},
			});
		}),

	getGoals: protectedProcedure
		.input(
			z.object({
				select: z.object({
					goalWeight: z.boolean().optional(),
					calorieLimit: z.boolean().optional(),
					waterIntake: z.boolean().optional(),
				}),
			})
		)
		.query(({ ctx: { session, prisma }, input }) => {
			const userId = session.user.id;

			return prisma.goal.findFirst({
				select: { ...input.select },
				where: {
					userId,
				},
			});
		}),
});
