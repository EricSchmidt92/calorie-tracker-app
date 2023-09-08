import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { calculateTotalCalories } from '@/utils/caloriesHelper';
import { $Enums, MealCategoryType } from '@prisma/client';

import { TRPCError } from '@trpc/server';
import { DateTime } from 'luxon';
import { z } from 'zod';

const mealCategoryEnum = z.enum<MealCategoryType, [MealCategoryType, ...MealCategoryType[]]>([
	'Breakfast',
	'Lunch',
	'Dinner',
	'Snack',
]);

const validateISOString = (dateTime: DateTime) => {
	if (!dateTime.isValid) {
		throw new TRPCError({
			message: 'Invalid date time string',
			code: 'BAD_REQUEST',
		});
	}
};

const GetDiaryEntrySchema = z.object({
	category: mealCategoryEnum,
	day: z.string().nonempty(),
});

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
				return foodEntry.reduce((total, { eatenServingSize, foodItem }) => {
					const { caloriesPerServing, standardServingSize } = foodItem;
					const totalCalories = calculateTotalCalories({
						standardServingSize,
						caloriesPerServing,
						eatenServingSize,
					});

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
		.input(GetDiaryEntrySchema)
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

	addEntry: protectedProcedure
		.input(
			z.object({
				foodItemId: z.string().nonempty(),
				day: z.string(),
				category: mealCategoryEnum,
				eatenServingSize: z.number().nonnegative(),
			})
		)
		.mutation(async ({ input, ctx: { prisma, session } }) => {
			const { day, category, foodItemId, eatenServingSize } = input;

			//TODO: export this block to common function?
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

			//* end TODO

			return prisma.foodDiary.create({
				data: {
					foodItem: {
						connect: {
							id: foodItemId,
						},
					},
					user: {
						connect: {
							id: userId,
						},
					},
					eatenServingSize,
					date: dateTime.toString(),
					mealCategory: {
						connect: {
							type: category,
						},
					},
				},
			});
		}),

	editEntry: protectedProcedure
		.input(
			z.object({
				diaryId: z.string().nonempty(),
				eatenServingSize: z.number().nonnegative(),
			})
		)
		.mutation(async ({ input, ctx: { prisma, session } }) => {
			const { diaryId, eatenServingSize } = input;

			return prisma.foodDiary.update({
				data: {
					eatenServingSize,
				},
				where: {
					id: diaryId,
					userId: session.user.id,
				},
			});
		}),

	removeEntry: protectedProcedure
		.input(z.object({ id: z.string().nonempty() }))
		.mutation(async ({ input: { id }, ctx: { prisma, session } }) => {
			const item = await prisma.foodDiary.delete({
				where: {
					id,
					userId: session.user.id,
				},
			});

			return { success: !!item };
		}),

	getDiaryEntryCount: protectedProcedure
		.input(GetDiaryEntrySchema)
		.query(async ({ input: { day, category }, ctx: { session, prisma } }) => {
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

			return prisma.foodDiary.count({
				where: {
					userId,
					mealCategory: {
						type: category,
					},
					date: {
						gte: dayStart,
						lte: dayEnd,
					},
				},
			});
		}),
});
