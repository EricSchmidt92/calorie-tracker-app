import { exampleRouter } from '@/server/api/routers/example';
import { createTRPCRouter } from '@/server/api/trpc';
import { foodEntriesRouter } from './routers/foodEntries';
import { foodItemsRouter } from './routers/foodItems';

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
	example: exampleRouter,
	foodEntries: foodEntriesRouter,
	footItems: foodItemsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
