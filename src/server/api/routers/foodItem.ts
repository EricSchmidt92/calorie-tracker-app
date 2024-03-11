import { FoodItem, UnitOfMeasurement } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';

export const unitOfMeasurementSchema = z.enum<UnitOfMeasurement, [UnitOfMeasurement, ...UnitOfMeasurement[]]>([
	'g',
	'mL',
]);

const foodFactValidator = z.object({
	product: z.object({
		nutriments: z.object({
			energy_value: z.number(),
			serving_size: z.string(), // ex "22.7 g"
			serving_quantity: z.number(),
		}),
	}),
});

type FoodFact = z.infer<typeof foodFactValidator>;

const extractInfo = ({ product: { nutriments } }: FoodFact) => {
	const caloriesPerServing = nutriments.energy_value;
	const standardServingSize = nutriments.serving_size;
	const servingUnitMatch = nutriments.serving_size.match(/\b(\d+(\.\d+)?)\s*([a-zA-Z]+)/);
	const servingUnit = servingUnitMatch ? servingUnitMatch[3] : '';

	return { caloriesPerServing, standardServingSize, servingUnit };
};

export const foodItemRouter = createTRPCRouter({
	create: protectedProcedure
		.input(
			z.object({
				name: z.string().min(1),
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

	getOrCreateFoodItemByBarcode: protectedProcedure
		.input(z.object({ barcode: z.string().min(1) }))
		.mutation(async ({ input: { barcode }, ctx: { prisma } }) => {
			const foodItem = await prisma.foodItem.findUnique({
				where: {
					barcode,
				},
			});

			if (foodItem) {
				return foodItem;
			}

			const openFoodFactsUrl = `https://world.openfoodfacts.net/api/v2/product/${barcode}`;

			const response = await fetch(openFoodFactsUrl);

			if (!response.ok) {
				throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Error finding barcode' });
			}

			const validated = await foodFactValidator.safeParseAsync(response.json());

			if (!validated.success) {
				throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: validated.error.message });
			}

			const { data } = validated;
		}),

	getFoodItemsByName: protectedProcedure
		.input(
			z.object({
				name: z.string().min(1),
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
