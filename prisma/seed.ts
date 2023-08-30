import { prisma } from '../src/server/db';
import { createId } from '@paralleldrive/cuid2';
async function main() {
	const breakfastId = createId();
	const lunchId = createId();
	const dinnerId = createId();
	const snackId = createId();

	//! must have logged in already before running seed.
	const { id: userId } = await prisma.user.findUniqueOrThrow({
		where: {
			email: process.env.USER_EMAIL,
		},
		select: {
			id: true,
		},
	});

	const foodItemsMap = {
		spam: {
			name: 'Spam Lite',
			servingSize: 56,
			caloriesPerServing: 110,
			id: createId(),
		},
		ramen: {
			name: 'Balduk Quattro Cheese Stir Fried Ramen Noodles',
			servingSize: 145,
			caloriesPerServing: 590,
			id: createId(),
		},
		salsa: {
			name: 'La Preferida Salsa Taquera Hot',
			servingSize: 30,
			caloriesPerServing: 10,
			id: createId(),
		},
		almondMilk: {
			name: 'Almond Milk',
			servingSize: 240,
			caloriesPerServing: 30,
			servingUnit: 'mL',
			id: createId(),
		},
		proteinShake: {
			name: 'Fairlife Core Power Chocolate Protein Shake',
			servingSize: 414,
			caloriesPerServing: 170,
			servingUnit: 'mL',
			id: createId(),
		},
	};

	await prisma.mealCategory.createMany({
		data: [
			{
				type: 'Breakfast',
				id: breakfastId,
			},
			{
				type: 'Lunch',
				id: lunchId,
			},
			{
				type: 'Dinner',
				id: dinnerId,
			},
			{
				type: 'Snack',
				id: snackId,
			},
		],
	});

	await prisma.foodItem.createMany({
		data: [
			foodItemsMap.spam,
			foodItemsMap.ramen,
			foodItemsMap.salsa,
			foodItemsMap.almondMilk,
			foodItemsMap.proteinShake,
		],
	});

	const user = await prisma.user.findFirstOrThrow({
		where: {
			email: {
				equals: process.env.USER_EMAIL,
			},
		},
		include: {
			goals: true,
		},
	});

	await prisma.goal.upsert({
		create: {
			calorieLimit: 1900,
			goalWeight: 160,
			userId: user.id,
		},
		update: {
			calorieLimit: 1900,
			goalWeight: 160,
		},

		where: {
			id: user.goals[0]?.id,
		},
	});

	await prisma.foodDiary.createMany({
		data: [
			{
				foodItemId: foodItemsMap.salsa.id,
				mealCategoryId: lunchId,
				userId,
				servingQuantity: 20,
			},
			{
				foodItemId: foodItemsMap.almondMilk.id,
				mealCategoryId: breakfastId,
				userId,
				servingQuantity: 30,
			},
		],
	});
}

main()
	.then(async () => {
		await prisma.$disconnect();
	})
	.catch(async e => {
		console.error(e);
		await prisma.$disconnect();
		process.exit(1);
	});
