import {
	QueryCache,
	QueryClient,
	QueryClientProvider,
} from "@tanstack/react-query";
import { createRouter as createTanstackRouter } from "@tanstack/react-router";
import { toast } from "sonner";

import "./app.css";
import Loader from "./components/loader.tsx";
import { ORPCContext } from "./hooks/use-orpc.ts";
import { routeTree } from "./routeTree.gen.ts";
import "./tailwind.css";
import { orpc } from "./utils/orpc";

export const createRouter = () => {
	const queryClient = new QueryClient({
		queryCache: new QueryCache({
			onError: (error) => {
				toast.error(`Error: ${error.message}`, {
					action: {
						label: "retry",
						onClick: () => {
							queryClient.invalidateQueries();
						},
					},
				});
			},
		}),
	});

	const router = createTanstackRouter({
		routeTree,
		scrollRestoration: true,
		defaultPreload: "intent",
		defaultPreloadStaleTime: 0,
		context: { orpc, queryClient },
		defaultPendingComponent: () => <Loader />,
		defaultNotFoundComponent: () => <div>Not Found</div>,
		defaultViewTransition: true,
		Wrap: ({ children }) => (
			<QueryClientProvider client={queryClient}>
				<ORPCContext.Provider value={orpc}>{children}</ORPCContext.Provider>
			</QueryClientProvider>
		),
	});

	return router;
};

// Register the router instance for type safety
declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof createRouter>;
	}
}
