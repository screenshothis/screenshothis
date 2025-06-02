import { RangeSchema } from "@screenshothis/schemas/dashboard";
import { sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "#/db";
import { logger } from "#/lib/logger";
import { protectedProcedure } from "#/lib/orpc";

export const dashboardRouter = {
	stats: protectedProcedure
		.input(
			z.object({
				range: RangeSchema.optional().default("30d"),
			}),
		)
		.handler(async ({ context, input }) => {
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
                date_trunc(${trunc}, gs.series_point) AS date,
                COALESCE(s.count, 0) AS count
            FROM
                generate_series(
                    to_timestamp(${fromSeconds}),
                    to_timestamp(${toSeconds}),
                    (${interval})::interval
                ) AS gs(series_point)
            LEFT JOIN (
                SELECT
                    date_trunc(${trunc}, "created_at") AS date,
                    count(*) AS count
                FROM screenshots
                WHERE "workspace_id" = ${context.session.activeWorkspaceId}
                    AND "created_at" >= to_timestamp(${fromSeconds})
                    AND "created_at" <= to_timestamp(${toSeconds})
                GROUP BY date
            ) s ON date_trunc(${trunc}, gs.series_point) = s.date
            ORDER BY date
        `,
				)
				.catch((error) => {
					logger.error({ err: error }, "failed to fetch stats");

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
                date_trunc(${trunc}, "created_at") AS date,
                count(*) AS count
            FROM screenshots
            WHERE "workspace_id" = ${context.session.activeWorkspaceId}
                AND "created_at" >= to_timestamp(${prevFromDate.getTime() / 1000})
                AND "created_at" < to_timestamp(${prevToDate.getTime() / 1000})
            GROUP BY date
        `,
				)
				.catch((error) => {
					logger.error({ err: error }, "failed to fetch previous stats");

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
};
