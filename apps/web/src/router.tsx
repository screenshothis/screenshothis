import {
	QueryCache,
	QueryClient,
	QueryClientProvider,
} from "@tanstack/react-query";
import { createRouter as createTanstackRouter } from "@tanstack/react-router";
import * as React from "react";

import "./app.css";
import Loader from "./components/loader.tsx";
import { NotFound } from "./components/not-found.tsx";
import { Button } from "./components/ui/button.tsx";
import * as AlertToast from "./components/ui/toast-alert.tsx";
import { toast } from "./components/ui/toast.tsx";
import { ORPCContext } from "./hooks/use-orpc.ts";
import { routeTree } from "./routeTree.gen.ts";
import "./tailwind.css";
import { orpc } from "./utils/orpc.ts";

export const createRouter = () => {
	const queryClient = new QueryClient({
		queryCache: new QueryCache({
			onError: (error) => {
				toast.custom((t) => (
					<AlertToast.Root
						t={t}
						$status="error"
						$variant="lighter"
						message={`Error: ${error.message}`}
						dismissable={false}
						action={
							<Button
								$size="xxs"
								$style="ghost"
								$type="error"
								onClick={() => queryClient.invalidateQueries()}
							>
								Retry
							</Button>
						}
					/>
				));
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
		defaultNotFoundComponent: () => (
			<React.Suspense fallback={<Loader />}>
				<NotFound />
			</React.Suspense>
		),
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
