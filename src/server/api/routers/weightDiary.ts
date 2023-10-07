import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { DateTime } from 'luxon';

export const weightDiaryRouter = createTRPCRouter({
	getCurrentWeight: protectedProcedure.query(({ ctx: { prisma, session } }) => {
		const userId = session.user.id;

		return prisma.weightDiary.findFirst({
			where: {
				userId,
			},
			orderBy: {
				createdAt: 'desc',
			},
			take: 1,
		});
	}),

	updateCurrentWeight: protectedProcedure
		.input(
			z.object({
				updatedWeight: z.number().positive(),
			})
		)
		.mutation(({ ctx: { prisma, session }, input }) => {
			const userId = session.user.id;

			return prisma.weightDiary.create({
				data: {
					weight: input.updatedWeight,
					userId,
				},
			});
		}),

	getEntries: protectedProcedure.query(({ ctx: { prisma, session } }) => {
		return prisma.weightDiary.findMany({
			where: {
				userId: session.user.id,
				createdAt: {
					gte: DateTime.now().minus({ month: 1 }).toISO() ?? '',
				},
			},
			orderBy: {
				createdAt: 'asc',
			},
		});
	}),
});
