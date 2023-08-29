import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';

export const foodItemsRouter = createTRPCRouter({
	getFoodItemsByName: protectedProcedure
		.input(
			z.object({
				name: z.string().nonempty(),
			})
		)
		.query(({ input: { name }, ctx: { prisma } }) => {
			return prisma.foodItemInfo.findMany({
				where: {
					name: {
						contains: name,
						mode: 'insensitive',
					},
				},
			});
		}),
});
