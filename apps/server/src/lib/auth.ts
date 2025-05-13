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
	}),
	basePath: "/auth",
	trustedOrigins: [env.CORS_ORIGIN || ""],
	emailAndPassword: {
		enabled: true,
		autoSignIn: true,
	},
	user: {
		modelName: "users",
	},
	session: {
		modelName: "sessions",
		additionalFields: {
			activeWorkspaceId: {
				type: "string",
				required: false,
				references: {
					model: "workspaces",
					field: "id",
					onDelete: "set null",
				},
			},
		},
	},
	account: {
		modelName: "accounts",
	},
	verification: {
		modelName: "verifications",
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
					modelName: "workspaces",
					additionalFields: {
						logoUrl: {
							type: "string",
							required: false,
						},
					},
				},
				member: {
					modelName: "workspaceMembers",
					fields: {
						organizationId: "workspaceId",
					},
					additionalFields: {
						workspaceId: {
							type: "string",
							required: true,
							references: {
								model: "workspaces",
								field: "id",
								onDelete: "set null",
							},
						},
					},
				},
				invitation: {
					modelName: "workspaceInvitations",
					fields: {
						organizationId: "workspaceId",
					},
					additionalFields: {
						workspaceId: {
							type: "string",
							required: true,
							references: {
								model: "workspaces",
								field: "id",
								onDelete: "set null",
							},
						},
					},
				},
				session: {
					modelName: "sessions",
					fields: {
						activeOrganizationId: "activeWorkspaceId",
					},
				},
			},
		}),
		apiKey({
			defaultPrefix: env.DEFAULT_API_KEY_PREFIX,
		}),
	],
});
