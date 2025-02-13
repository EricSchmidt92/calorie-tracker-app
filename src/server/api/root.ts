import { createTRPCRouter } from '@/server/api/trpc';
import { foodDiaryRouter } from './routers/foodDiary';
import { foodItemRouter } from './routers/foodItem';
import { mealCategoryRouter } from './routers/mealCategory';
import { profileRouter } from './routers/profile';
import { goalsRouter } from './routers/goals';
import { weightDiaryRouter } from './routers/weightDiary';
import { waterIntakeDiaryRouter } from './routers/waterIntakeDiary';

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
	foodDiary: foodDiaryRouter,
	foodItem: foodItemRouter,
	mealCategory: mealCategoryRouter,
	profile: profileRouter,
	goals: goalsRouter,
	weightDiary: weightDiaryRouter,
	waterIntakeDiary: waterIntakeDiaryRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
