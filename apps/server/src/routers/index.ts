import { dashboardRouter } from "./dashboard";
import { screenshotsRouter } from "./screenshots";
import { usersRouter } from "./users";
import { workspacesRouter } from "./workspaces";

export const appRouter = {
	users: usersRouter,
	dashboard: dashboardRouter,
	screenshots: screenshotsRouter,
	workspaces: workspacesRouter,
} as const;

export type AppRouter = typeof appRouter;
