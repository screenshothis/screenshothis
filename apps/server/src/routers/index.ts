import { checkoutsRouter } from "./checkouts";
import { dashboardRouter } from "./dashboard";
import { screenshotsRouter } from "./screenshots";
import { usersRouter } from "./users";

export const appRouter = {
	users: usersRouter,
	dashboard: dashboardRouter,
	screenshots: screenshotsRouter,
	checkouts: checkoutsRouter,
} as const;

export type AppRouter = typeof appRouter;
