import { eq, sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "#/db";
import { users, workspaceMembers, workspaces } from "#/db/schema";
import { unkey } from "#/lib/unkey";
import { protectedProcedure, publicProcedure, router } from "../lib/trpc";

export const appRouter = router({
	healthCheck: publicProcedure.query(() => {
		return "OK";
	}),
	me: protectedProcedure.query(async ({ ctx }) => {
		const user = await db.query.users.findFirst({
			where: eq(users.externalId, ctx.session.userId),
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
				id: workspaces.id,
				name: workspaces.name,
			})
			.from(workspaceMembers)
			.innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
			.where(eq(workspaceMembers.userId, user.id));

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
			},
			// For some reason I needed to add this for trpc type inference
			workspaces: userWorkspaces as {
				id: string;
				name: string;
			}[],
		};
	}),
	stats: protectedProcedure
		.input(
			z.object({ range: z.enum(["24h", "7d", "30d", "year"]).default("30d") }),
		)
		.query(async ({ ctx, input }) => {
			if (!ctx.user?.currentWorkspaceId) {
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

			const data = await db.execute(
				sql.raw(`
				SELECT
					gs.date,
					COALESCE(s.count, 0) AS count
				FROM
					generate_series(
						to_timestamp(${fromSeconds}),
						to_timestamp(${toSeconds}),
						interval '${interval}'
					) AS gs(date)
				LEFT JOIN (
					SELECT
						date_trunc('${trunc}', to_timestamp(("created_at" / 1000)::double precision)) AS date,
						count(*) AS count
					FROM screenshots
					WHERE "workspace_id" = '${ctx.user.currentWorkspaceId}'
						AND ("created_at")::bigint >= ${BigInt(fromDate.getTime())}
					GROUP BY date
				) s ON gs.date = s.date
				ORDER BY gs.date
			`),
			);

			return data.rows.map((row) => ({
				date: row.date,
				count: Number(row.count),
			}));
		}),
});
export type AppRouter = typeof appRouter;
