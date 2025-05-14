import { polar } from "@polar-sh/better-auth";
import { Polar } from "@polar-sh/sdk";
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

const polarClient = new Polar({
	accessToken: env.POLAR_ACCESS_TOKEN,
	server: env.POLAR_SERVER,
});

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
		polar({
			client: polarClient,
			createCustomerOnSignUp: true,
			enableCustomerPortal: true,
			checkout: {
				enabled: true,
				products: [
					{
						productId: env.POLAR_LITE_PRODUCT_ID,
						slug: "lite",
					},
					{
						productId: env.POLAR_PRO_PRODUCT_ID,
						slug: "pro",
					},
				],
				successUrl: env.POLAR_SUCCESS_URL,
				authenticatedUsersOnly: true,
			},
			webhooks: {
				secret: env.POLAR_WEBHOOK_SECRET,
				async onCustomerStateChanged(payload) {
					await db
						.insert(schema.polarCustomerState)
						.values({
							metadata: payload.data.metadata,
							externalId: payload.data.externalId,
							email: payload.data.email,
							name: payload.data.name,
							activeSubscriptions: payload.data.activeSubscriptions,
							grantedBenefits: payload.data.grantedBenefits,
							activeMeters: payload.data.activeMeters,
						})
						.onConflictDoUpdate({
							target: schema.polarCustomerState.externalId,
							set: {
								metadata: payload.data.metadata,
								activeSubscriptions: payload.data.activeSubscriptions,
								grantedBenefits: payload.data.grantedBenefits,
								activeMeters: payload.data.activeMeters,
							},
						});
				},
			},
		}),
	],
});
