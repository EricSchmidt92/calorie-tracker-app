import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';

import { TRPCError } from '@trpc/server';
import { DateTime } from 'luxon';
import { z } from 'zod';

const validateISOString = (dateTime: DateTime) => {
	if (!dateTime.isValid) {
		throw new TRPCError({
			message: 'Invalid date time string',
			code: 'BAD_REQUEST',
		});
	}
};

export const foodEntriesRouter = createTRPCRouter({
	getDailyCalorieSummary: protectedProcedure
		.input(
			z.object({
				day: z.string().nonempty(),
			})
		)
		.query(async ({ input: { day }, ctx: { prisma, session } }) => {
			const dateTime = DateTime.fromISO(day);
			const userId = session.user.id;

			validateISOString(dateTime);

			const dayStart = dateTime.startOf('day').toJSDate();
			const dayEnd = dateTime.endOf('day').toJSDate();

			const entries = await prisma.mealCategory.findMany({
				include: {
					foodEntries: {
						include: {
							foodItemInfo: true,
						},
						where: {
							userId,
							date: {
								gte: dayStart,
								lte: dayEnd,
							},
						},
					},
				},
			});

			type FoodEntry = (typeof entries)[number]['foodEntries'];

			const foodEntryReduce = (foodEntry: FoodEntry) => {
				return foodEntry.reduce((total, { servingQuantity, foodItemInfo }) => {
					const caloriesPerServing = foodItemInfo.caloriesPerServing;
					const servingSize = foodItemInfo.servingSize;
					const caloriesPerUnitOfMeasurement = caloriesPerServing / servingSize;
					const totalCalories = servingQuantity * caloriesPerUnitOfMeasurement;

					return total + totalCalories;
				}, 0);
			};

			const entrySummaries = entries.map(({ name, id, foodEntries }) => {
				return {
					name,
					id,
					calorieCount: foodEntryReduce(foodEntries),
					foodItems: foodEntries.map(entry => entry.foodItemInfo.name),
				};
			});

			return entrySummaries;
		}),
});
