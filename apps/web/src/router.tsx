import {
	QueryCache,
	QueryClient,
	QueryClientProvider,
} from "@tanstack/react-query";
import { createRouter as createTanstackRouter } from "@tanstack/react-router";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { toast } from "sonner";

import type { AppRouter } from "../../server/src/routers";
import "./app.css";
import Loader from "./components/loader.tsx";
import { routeTree } from "./routeTree.gen.ts";
import "./tailwind.css";
import { TRPCProvider } from "./utils/trpc.ts";

export const queryClient = new QueryClient({
	queryCache: new QueryCache({
		onError: (error) => {
			toast.error(error.message, {
				action: {
					label: "retry",
					onClick: () => {
						queryClient.invalidateQueries();
					},
				},
			});
		},
	}),
	defaultOptions: { queries: { staleTime: 60 * 1000 } },
});

const trpcClient = createTRPCClient<AppRouter>({
	links: [
		httpBatchLink({
			url: `${import.meta.env.VITE_SERVER_URL}/trpc`,
			fetch(url, options) {
				return fetch(url, {
					...options,
					credentials: "include",
				});
			},
		}),
	],
});

const trpc = createTRPCOptionsProxy({
	client: trpcClient,
	queryClient: queryClient,
});

export const createRouter = () => {
	const router = createTanstackRouter({
		routeTree,
		scrollRestoration: true,
		defaultPreloadStaleTime: 0,
		context: { trpc, queryClient },
		defaultPendingComponent: () => <Loader />,
		defaultNotFoundComponent: () => <div>Not Found</div>,
		Wrap: ({ children }) => (
			<QueryClientProvider client={queryClient}>
				<TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
					{children}
				</TRPCProvider>
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
