import { ORPCError } from "@orpc/client";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "#/db";
import * as schema from "#/db/schema";
import { protectedProcedure } from "#/lib/orpc";
import { unkey } from "#/lib/unkey";
import { CreateScreenshotParamsSchema } from "#/routes/screenshots/schema";
import { getOrCreateScreenshot } from "#/utils/screenshot";

export const appRouter = {
	me: protectedProcedure.handler(async ({ context }) => {
		const user = await db.query.users.findFirst({
			where: eq(schema.users.externalId, context.session.userId),
			with: {
				currentWorkspace: {
					columns: {
						id: true,
						name: true,
					},
					with: {
						accessToken: {
							columns: {
								externalId: true,
								token: true,
							},
						},
					},
				},
			},
		});

		if (!user) {
			throw new Error("User not found");
		}

		if (!user.currentWorkspace?.accessToken) {
			throw new Error("Access token not found for current workspace");
		}

		const { result } = await unkey.keys.get({
			keyId: user.currentWorkspace.accessToken.externalId,
		});

		if (!result) {
			throw new Error("Access token not found");
		}

		const userWorkspaces = await db
			.select({
				id: schema.workspaces.id,
				name: schema.workspaces.name,
			})
			.from(schema.workspaceMembers)
			.innerJoin(
				schema.workspaces,
				eq(schema.workspaceMembers.workspaceId, schema.workspaces.id),
			)
			.where(eq(schema.workspaceMembers.userId, user.id));

		return {
			fullName: `${user.firstName} ${user.lastName}`,
			email: user.email,
			imageUrl: user.imageUrl,
			currentWorkspace: {
				id: user.currentWorkspace.id,
				name: user.currentWorkspace.name,
				usage: {
					totalRequests: result.refill?.amount,
					remainingRequests: result.remaining,
				},
				accessToken: {
					token: user.currentWorkspace.accessToken.token,
					redactedToken: Array.from(user.currentWorkspace.accessToken.token)
						.map((_, i) =>
							i > 2 ? "•" : user.currentWorkspace?.accessToken.token[i],
						)
						.join(""),
				},
			},
			workspaces: userWorkspaces,
		};
	}),
	stats: protectedProcedure
		.input(
			z.object({
				range: z.enum(["24h", "7d", "30d", "year"]).optional().default("30d"),
			}),
		)
		.handler(async ({ context, input }) => {
			if (!context.user?.currentWorkspaceId) {
				throw new Error("Current workspace not found");
			}

			let interval: string;
			let trunc: string;
			let fromDate: Date;
			const now = new Date();

			switch (input.range) {
				case "24h":
					interval = "1 hour";
					trunc = "hour";
					fromDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
					break;
				case "7d":
					interval = "1 day";
					trunc = "day";
					fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
					break;
				case "30d":
					interval = "1 day";
					trunc = "day";
					fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
					break;
				case "year":
					interval = "1 month";
					trunc = "month";
					fromDate = new Date(now.getFullYear(), 0, 1);
					break;
				default:
					throw new Error("Invalid range");
			}

			const toDate = now;

			const fromSeconds = fromDate.getTime() / 1000;
			const toSeconds = toDate.getTime() / 1000;

			const data = await db
				.execute(
					sql`
            SELECT
                gs.date,
                COALESCE(s.count, 0) AS count
            FROM
                generate_series(
                    to_timestamp(${fromSeconds}),
                    to_timestamp(${toSeconds}),
                    (${interval})::interval
                ) AS gs(date)
            LEFT JOIN (
                SELECT
                    date_trunc(${trunc}, to_timestamp(("created_at" / 1000)::double precision)) AS date,
                    count(*) AS count
                FROM screenshots
                WHERE "workspace_id" = ${context.user.currentWorkspaceId}
                    AND ("created_at")::bigint >= ${BigInt(fromDate.getTime())}
                GROUP BY date
            ) s ON gs.date = s.date
            ORDER BY gs.date
        `,
				)
				.catch((error) => {
					console.error("Failed to fetch stats", error);
					throw new Error("Failed to fetch stats");
				});

			// Calculate previous period
			const periodMs = toDate.getTime() - fromDate.getTime();
			const prevToDate = fromDate;
			const prevFromDate = new Date(fromDate.getTime() - periodMs);

			// Build a map of previous period counts by date for comparison
			const prevDataRows = await db
				.execute(
					sql`
            SELECT
                date_trunc(${trunc}, to_timestamp(("created_at" / 1000)::double precision)) AS date,
                count(*) AS count
            FROM screenshots
            WHERE "workspace_id" = ${context.user.currentWorkspaceId}
                AND ("created_at")::bigint >= ${BigInt(prevFromDate.getTime())}
                AND ("created_at")::bigint < ${BigInt(prevToDate.getTime())}
            GROUP BY date
        `,
				)
				.catch((error) => {
					console.error("Failed to fetch previous stats", error);
					throw new Error("Failed to fetch previous stats");
				});

			const prevMap = new Map<string, number>();
			for (const row of prevDataRows.rows) {
				prevMap.set(String(row.date), Number(row.count));
			}

			return {
				data: data.rows.map((row) => {
					const prevCount = prevMap.get(String(row.date)) ?? 0;
					const count = Number(row.count);
					let percentChange = 0;
					if (prevCount === 0 && count > 0) {
						percentChange = 100;
					} else if (prevCount > 0) {
						percentChange = ((count - prevCount) / prevCount) * 100;
					}
					const sign = percentChange > 0 ? "+" : "";
					return {
						date: row.date as string,
						value: count,
						prev: `${sign}${percentChange.toFixed(0)}%`,
					};
				}),
			};
		}),
	playground: protectedProcedure
		.input(CreateScreenshotParamsSchema)
		.handler(async ({ context, input }) => {
			if (!context.user?.currentWorkspaceId) {
				throw new ORPCError("UNAUTHORIZED", {
					message: "Current workspace not found",
				});
			}

			try {
				const { object, created } = await getOrCreateScreenshot(
					context.user.currentWorkspaceId,
					input,
				);

				if (!object) {
					throw new ORPCError("NOT_FOUND", {
						message: "Failed to get or create screenshot",
					});
				}

				const accessToken = await db.query.accessTokens.findFirst({
					where: eq(
						schema.accessTokens.workspaceId,
						context.user.currentWorkspaceId,
					),
					columns: {
						token: true,
						externalId: true,
					},
				});

				if (accessToken?.externalId && created) {
					await unkey.keys.updateRemaining({
						keyId: accessToken.externalId,
						op: "decrement",
						value: 1,
					});
				}

				return {
					image: `data:image/${input.format};base64,${Buffer.from(object).toString("base64")}`,
				};
			} catch (error) {
				console.error("Failed to get screenshot", error);

				throw new ORPCError("BAD_REQUEST", {
					message: "Failed to get screenshot",
				});
			}
		}),
} as const;

export type AppRouter = typeof appRouter;
