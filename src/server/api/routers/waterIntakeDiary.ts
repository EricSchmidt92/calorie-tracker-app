import { DateTime } from 'luxon';
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { validateAndGetDayBoundaries } from './utils/ISOInputValidator';

export const waterIntakeDiaryRouter = createTRPCRouter({
	getEntriesByDay: protectedProcedure
		.input(
			z.object({
				day: z.string().min(1),
			})
		)
		.query(({ ctx: { prisma, session }, input }) => {
			const userId = session.user.id;
			const dateTime = DateTime.fromISO(input.day);

			const { dayStart, dayEnd } = validateAndGetDayBoundaries(dateTime);

			return prisma.waterIntakeDiary.findMany({
				where: {
					userId,
					createdAt: {
						gte: dayStart,
						lte: dayEnd,
					},
				},
			});
		}),

	addEntry: protectedProcedure.mutation(async ({ ctx: { prisma, session } }) => {
		const userId = session.user.id;

		return prisma.waterIntakeDiary.create({
			data: {
				user: {
					connect: {
						id: userId,
					},
				},
			},
		});
	}),

	removeEntry: protectedProcedure
		.input(z.object({ entryId: z.string().min(1) }))
		.mutation(async ({ ctx: { session, prisma }, input }) => {
			return prisma.waterIntakeDiary.delete({
				where: {
					id: input.entryId,
					userId: session.user.id,
				},
			});
		}),
});
