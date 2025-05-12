import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";

import { getActiveWorkspace } from "#/actions/get-active-workspace";
import { env } from "#/utils/env";
import { db } from "../db";
import * as schema from "../db/schema/auth";

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",
		schema: schema,
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
					await auth.api.createOrganization({
						body: {
							name: `${user.name.split(" ")[0]}'s Workspace`,
							slug: `ws-${user.name.split(" ")[0].toLowerCase()}`,
							userId: user.id,
						},
					});
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
					modelName: "workspace_members",
				},
				invitation: {
					modelName: "workspace_invitations",
				},
			},
		}),
	],
});
