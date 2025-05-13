import { generateId } from "@screenshothis/id";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { apiKey, organization } from "better-auth/plugins";
import {
	adjectives,
	nouns,
	uniqueUsernameGenerator,
} from "unique-username-generator";

import { getActiveWorkspace } from "#/actions/get-active-workspace";
import { env } from "#/utils/env";
import { keyLimits } from "#/utils/keys";
import { db } from "../db";
import * as schema from "../db/schema";

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",
		schema,
		usePlural: true,
		debugLogs: true,
	}),
	basePath: "/auth",
	trustedOrigins: [env.CORS_ORIGIN || ""],
	emailAndPassword: {
		enabled: true,
		autoSignIn: true,
	},
	session: {
		additionalFields: {
			activeWorkspaceId: {
				type: "string",
				required: false,
				references: {
					model: "workspace",
					field: "id",
					onDelete: "set null",
				},
			},
		},
	},
	databaseHooks: {
		user: {
			create: {
				async after(user) {
					try {
						await auth.api.createOrganization({
							body: {
								name: `${user.name.split(" ")[0]}'s Workspace`,
								slug: uniqueUsernameGenerator({
									dictionaries: [adjectives, nouns],
									separator: "-",
									style: "lowerCase",
								}),
								userId: user.id,
							},
						});

						await auth.api.createApiKey({
							body: {
								name: `${user.name.split(" ")[0]}'s API Key`,
								...keyLimits.free,
								userId: user.id,
							},
						});
					} catch (error) {
						console.error(error);
					}
				},
			},
		},
		session: {
			create: {
				before: async (session) => {
					const workspace = await getActiveWorkspace(session.userId);

					return {
						data: {
							...session,
							activeWorkspaceId: workspace.id,
						},
					};
				},
			},
		},
	},
	plugins: [
		organization({
			schema: {
				organization: {
					modelName: "workspace",
					additionalFields: {
						logoUrl: {
							type: "string",
							required: false,
						},
					},
				},
				member: {
					modelName: "workspaceMember",
					fields: {
						organizationId: "workspaceId",
					},
					additionalFields: {
						workspaceId: {
							type: "string",
							required: true,
							references: {
								model: "workspace",
								field: "id",
								onDelete: "set null",
							},
						},
					},
				},
				invitation: {
					modelName: "workspaceInvitation",
					fields: {
						organizationId: "workspaceId",
					},
					additionalFields: {
						workspaceId: {
							type: "string",
							required: true,
							references: {
								model: "workspace",
								field: "id",
								onDelete: "set null",
							},
						},
					},
				},
				session: {
					fields: {
						activeOrganizationId: "activeWorkspaceId",
					},
				},
			},
		}),
		apiKey({
			defaultPrefix: env.DEFAULT_API_KEY_PREFIX,
			enableMetadata: true,
			customAPIKeyGetter(ctx) {
				if (!ctx.request?.url) {
					return null;
				}

				const url = new URL(ctx.request?.url);
				return url.searchParams.get("api_key");
			},
			customKeyGenerator(options) {
				return generateId(options.prefix ?? "api", options.length);
			},
		}),
	],
});
