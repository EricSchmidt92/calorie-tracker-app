import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { $Enums, FoodDiary, MealCategoryType } from '@prisma/client';

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

export interface MealCategorySummary {
	type: $Enums.MealCategoryType;
	id: string;
	calorieCount: number;
	foodItems: string[];
}

export interface DailySummary {
	calorieLimit: number;
	caloriesConsumed: number;
	mealCategorySummaries: MealCategorySummary[];
}

export const foodDiaryRouter = createTRPCRouter({
	getDailyCalorieSummary: protectedProcedure
		.input(
			z.object({
				day: z.string().nonempty(),
			})
		)
		.query(async ({ input: { day }, ctx: { prisma, session } }): Promise<DailySummary> => {
			const dateTime = DateTime.fromISO(day);
			const userId = session.user.id;

			validateISOString(dateTime);

			const dayStart = dateTime.startOf('day').toISO();
			const dayEnd = dateTime.endOf('day').toISO();

			if (!dayStart || !dayEnd) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'Invalid date for day passed in',
				});
			}

			const entries = await prisma.mealCategory.findMany({
				include: {
					foodDiaryEntries: {
						include: {
							foodItem: true,
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

			const { calorieLimit } = await prisma.goal.findFirstOrThrow({
				select: {
					calorieLimit: true,
				},
				where: {
					userId,
				},
			});

			type FoodEntry = (typeof entries)[number]['foodDiaryEntries'];

			const foodEntryReduce = (foodEntry: FoodEntry) => {
				return foodEntry.reduce((total, { servingQuantity, foodItem }) => {
					const caloriesPerServing = foodItem.caloriesPerServing;
					const servingSize = foodItem.servingSize;
					const caloriesPerUnitOfMeasurement = caloriesPerServing / servingSize;
					const totalCalories = Math.round(servingQuantity * caloriesPerUnitOfMeasurement);

					return total + totalCalories;
				}, 0);
			};

			const entrySummaries = entries.map(({ type, id, foodDiaryEntries }) => {
				return {
					type,
					id,
					calorieCount: foodEntryReduce(foodDiaryEntries),
					foodItems: foodDiaryEntries.map(entry => entry.foodItem.name),
				};
			});

			const caloriesConsumed = entrySummaries.reduce(
				(accumulator, { calorieCount }) => accumulator + calorieCount,
				0
			);

			return {
				calorieLimit: calorieLimit ?? 0,
				mealCategorySummaries: entrySummaries,
				caloriesConsumed,
			};
		}),

	getEntriesByDayAndCategory: protectedProcedure
		.input(
			z.object({
				category: z.enum<MealCategoryType, [MealCategoryType, ...MealCategoryType[]]>([
					'Breakfast',
					'Lunch',
					'Dinner',
					'Snack',
				]),
				day: z.string().nonempty(),
			})
		)
		.query(async ({ ctx: { prisma, session }, input: { day, category } }) => {
			const dateTime = DateTime.fromISO(day);
			const userId = session.user.id;

			validateISOString(dateTime);

			const dayStart = dateTime.startOf('day').toISO();
			const dayEnd = dateTime.endOf('day').toISO();

			if (!dayStart || !dayEnd) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'Invalid date for day passed in',
				});
			}

			return prisma.foodDiary.findMany({
				include: {
					foodItem: true,
				},
				where: {
					userId,
					date: {
						gte: dayStart,
						lte: dayEnd,
					},
					mealCategory: {
						type: category,
					},
				},
			});
		}),
});
