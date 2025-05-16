import type { Sitemap } from "tanstack-router-sitemap";

import type { FileRouteTypes } from "#/routeTree.gen.ts";

// This will become a string literal union of all your routes
export type TRoutes = FileRouteTypes["fullPaths"];

// Define your sitemap
export const sitemap: Sitemap<TRoutes> = {
	siteUrl: "https://screenshothis.com",
	defaultPriority: 0.5,
	routes: {
		"/": {
			priority: 1,
			changeFrequency: "daily",
		},
		"/login": {
			priority: 0.8,
			changeFrequency: "daily",
		},
		"/register": {
			priority: 0.8,
			changeFrequency: "daily",
		},
		"/forgot-password": {
			priority: 0.8,
			changeFrequency: "daily",
		},
		"/legal/$": async () => {
			return ["privacy", "terms"].map((page) => ({
				path: `/legal/${page}`,
				priority: 0.8,
				changeFrequency: "daily",
			}));
		},
	},
};
