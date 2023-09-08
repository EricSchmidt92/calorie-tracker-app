import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { FoodItem, UnitOfMeasurement } from '@prisma/client';

export const unitOfMeasurementSchema = z.enum<
	UnitOfMeasurement,
	[UnitOfMeasurement, ...UnitOfMeasurement[]]
>(['g', 'mL']);

export const foodItemRouter = createTRPCRouter({
	getFoodItemsByName: protectedProcedure
		.input(
			z.object({
				name: z.string().nonempty(),
			})
		)
		.query(({ input: { name }, ctx: { prisma } }): Promise<FoodItem[]> => {
			return prisma.foodItem.findMany({
				where: {
					name: {
						contains: name,
						mode: 'insensitive',
					},
				},
			});
		}),

	create: protectedProcedure
		.input(
			z.object({
				name: z.string().nonempty(),
				caloriesPerServing: z.number().nonnegative(),
				servingUnit: unitOfMeasurementSchema,
				standardServingSize: z.number().nonnegative(),
			})
		)
		.mutation(async ({ input, ctx: { prisma, session } }) => {
			return prisma.foodItem.create({
				data: {
					...input,
				},
			});
		}),
});
