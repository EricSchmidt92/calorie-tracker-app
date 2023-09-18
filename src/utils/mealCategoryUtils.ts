import { MealCategoryType } from '@prisma/client';
import * as Icons from 'tabler-icons-react';

export type IconName = keyof typeof Icons;

export const IconMap: Record<MealCategoryType, IconName> = {
	Breakfast: 'Coffee',
	Lunch: 'Salad',
	Dinner: 'Soup',
	Snack: 'Cookie',
};
