import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { FoodItem } from '@prisma/client';

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
});
