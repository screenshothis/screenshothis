import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";

import { db } from "../db";
import * as schema from "../db/schema/auth";

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",
		schema: schema,
	}),
	trustedOrigins: [process.env.CORS_ORIGIN || ""],
	emailAndPassword: {
		enabled: true,
		autoSignIn: true,
	},
	user: {
		additionalFields: {
			currentWorkspaceId: {
				type: "string",
				required: true,
				references: {
					model: "workspaces",
					field: "id",
					onDelete: "set null",
				},
			},
		},
		modelName: "users",
	},
	session: {
		modelName: "sessions",
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
