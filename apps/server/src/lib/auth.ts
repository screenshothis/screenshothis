import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";

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
