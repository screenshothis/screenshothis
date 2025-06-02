import {
	checkout,
	polar,
	portal,
	usage,
	webhooks,
} from "@polar-sh/better-auth";
import { keyLimits } from "@screenshothis/common/keys";
import { generateId } from "@screenshothis/id";
import { betterAuth } from "better-auth";
import { emailHarmony } from "better-auth-harmony";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { apiKey, oneTap, organization } from "better-auth/plugins";
import {
	adjectives,
	nouns,
	uniqueUsernameGenerator,
} from "unique-username-generator";

import { getActiveWorkspace } from "../actions/get-active-workspace";
import { getProductSlugById } from "../actions/get-product-slug-by-id";
import { updateUserRequestLimits } from "../actions/update-user-request-limits";
import { db } from "../db";
import * as schema from "../db/schema";
import { env } from "../utils/env";
import { logger } from "./logger";
import { polarClient, polarProducts } from "./polar";

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
	socialProviders: {
		...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
			? {
					google: {
						prompt: "select_account",
						clientId: env.GOOGLE_CLIENT_ID,
						clientSecret: env.GOOGLE_CLIENT_SECRET,
					},
				}
			: {}),
	},
	advanced: {
		cookiePrefix: "screenshothis",
		...(process.env.NODE_ENV === "production"
			? {
					crossSubDomainCookies: {
						enabled: true,
						domain: ".screenshothis.com",
					},
					defaultCookieAttributes: {
						secure: true,
						httpOnly: true,
						sameSite: "none",
						partitioned: true,
					},
				}
			: {}),
		database: {
			generateId(options) {
				return generateId(options.model, options.size);
			},
		},
	},
	user: {
		fields: {
			image: "imageUrl",
		},
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

						await db.insert(schema.requestLimits).values({
							...keyLimits.free.metadata,
							userId: user.id,
							plan: "free",
						});
					} catch (error) {
						logger.error({ err: error }, "failed during user create hook");
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
		}),
		...(env.POLAR_ACCESS_TOKEN
			? [
					polar({
						client: polarClient,
						createCustomerOnSignUp: true,
						use: [
							checkout({
								products: polarProducts,
								successUrl: env.POLAR_SUCCESS_URL,
								authenticatedUsersOnly: true,
							}),
							portal(),
							usage({
								creditProducts: polarProducts,
							}),
							...(env.POLAR_WEBHOOK_SECRET
								? [
										webhooks({
											secret: env.POLAR_WEBHOOK_SECRET,
											async onCustomerStateChanged(payload) {
												await db
													.insert(schema.polarCustomerState)
													.values({
														metadata: payload.data.metadata,
														externalId: payload.data.externalId,
														email: payload.data.email,
														name: payload.data.name,
														activeSubscriptions:
															payload.data.activeSubscriptions,
														grantedBenefits: payload.data.grantedBenefits,
														activeMeters: payload.data.activeMeters,
													})
													.onConflictDoUpdate({
														target: schema.polarCustomerState.externalId,
														set: {
															email: payload.data.email,
															name: payload.data.name,
															metadata: payload.data.metadata,
															activeSubscriptions:
																payload.data.activeSubscriptions,
															grantedBenefits: payload.data.grantedBenefits,
															activeMeters: payload.data.activeMeters,
														},
													});
											},
											async onSubscriptionCreated(payload) {
												const data = payload.data;

												const productSlug = await getProductSlugById(
													data.productId,
												);

												if (!data.customer.externalId) {
													throw new Error("Customer external ID is required");
												}

												await updateUserRequestLimits(
													data.customer.externalId,
													productSlug,
												);
											},
										}),
									]
								: []),
						],
					}),
				]
			: []),
		emailHarmony(),
		oneTap({
			clientId: env.GOOGLE_CLIENT_ID,
		}),
	],
});
