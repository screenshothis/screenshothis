import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { endTime, setMetric, startTime } from "hono/timing";

import type { Variables } from "#/common/environment";
import { db } from "#/db";
import { s3 } from "#/lib/s3";
import { getQueueHealth } from "#/lib/screenshot-queue";

const health = new OpenAPIHono<{ Variables: Variables }>();

const HealthCheckSchema = z.object({
	status: z.enum(["healthy", "degraded", "unhealthy"]),
	timestamp: z.string(),
	uptime: z.number(),
	checks: z.array(
		z.object({
			name: z.string(),
			status: z.enum(["pass", "fail"]),
			duration: z.number().optional(),
			error: z.string().optional(),
			details: z.record(z.any()).optional(),
		}),
	),
	version: z.string().optional(),
});

health.openapi(
	createRoute({
		method: "get",
		path: "/",
		responses: {
			200: {
				content: {
					"application/json": {
						schema: HealthCheckSchema,
					},
				},
				description: "Health check passed",
			},
			503: {
				content: {
					"application/json": {
						schema: HealthCheckSchema,
					},
				},
				description: "Health check failed",
			},
		},
	}),
	async (c) => {
		startTime(c, "health-check");

		const startTimestamp = Date.now();

		const checks = await Promise.allSettled([
			(async () => {
				const dbStart = Date.now();
				try {
					await db.execute("SELECT 1");
					return {
						name: "database",
						status: "pass" as const,
						duration: Date.now() - dbStart,
					};
				} catch (error) {
					return {
						name: "database",
						status: "fail" as const,
						duration: Date.now() - dbStart,
						error: error instanceof Error ? error.message : "Unknown error",
					};
				}
			})(),

			(async () => {
				const storageStart = Date.now();
				try {
					await s3.list({ maxKeys: 1 });

					return {
						name: "storage",
						status: "pass" as const,
						duration: Date.now() - storageStart,
					};
				} catch (error) {
					return {
						name: "storage",
						status: "fail" as const,
						duration: Date.now() - storageStart,
						error: error instanceof Error ? error.message : "Unknown error",
					};
				}
			})(),

			(async () => {
				const queueStart = Date.now();
				try {
					const queueHealth = await getQueueHealth();
					const QUEUE_FAILED_THRESHOLD = Number.parseInt(
						process.env.QUEUE_FAILED_THRESHOLD || "10",
						10,
					);
					const QUEUE_WAITING_THRESHOLD = Number.parseInt(
						process.env.QUEUE_WAITING_THRESHOLD || "100",
						10,
					);
					const hasQueueIssues =
						queueHealth.error ||
						!queueHealth.workerRunning ||
						queueHealth.failed > QUEUE_FAILED_THRESHOLD ||
						queueHealth.waiting > QUEUE_WAITING_THRESHOLD;

					return {
						name: "queue",
						status: hasQueueIssues ? ("fail" as const) : ("pass" as const),
						duration: Date.now() - queueStart,
						details: queueHealth,
						error: queueHealth.error,
					};
				} catch (error) {
					return {
						name: "queue",
						status: "fail" as const,
						duration: Date.now() - queueStart,
						error: error instanceof Error ? error.message : "Unknown error",
					};
				}
			})(),
		]);

		const healthChecks = checks.map((check) =>
			check.status === "fulfilled"
				? check.value
				: {
						name: "unknown",
						status: "fail" as const,
						error: "Check failed to execute",
					},
		);

		const hasFailures = healthChecks.some((check) => check.status === "fail");
		const status: "healthy" | "degraded" | "unhealthy" = hasFailures
			? "degraded"
			: "healthy";

		const totalDuration = Date.now() - startTimestamp;
		setMetric(c, "health-check-duration", totalDuration);

		endTime(c, "health-check");

		const response = {
			status,
			timestamp: new Date().toISOString(),
			uptime: process.uptime(),
			checks: healthChecks,
			version: process.env.npm_package_version || "unknown",
		};

		return c.json(response, hasFailures ? 503 : 200);
	},
);

health.openapi(
	createRoute({
		method: "get",
		path: "/ready",
		responses: {
			200: {
				content: {
					"application/json": {
						schema: z.object({
							status: z.literal("ready"),
							timestamp: z.string(),
						}),
					},
				},
				description: "Service is ready",
			},
			503: {
				content: {
					"application/json": {
						schema: z.object({
							status: z.literal("not ready"),
							timestamp: z.string(),
							error: z.string(),
						}),
					},
				},
				description: "Service is not ready",
			},
		},
	}),
	async (c) => {
		try {
			await db.execute("SELECT 1");

			return c.json(
				{
					status: "ready" as const,
					timestamp: new Date().toISOString(),
				},
				200,
			);
		} catch (error) {
			return c.json(
				{
					status: "not ready" as const,
					timestamp: new Date().toISOString(),
					error: error instanceof Error ? error.message : "Unknown error",
				},
				503,
			);
		}
	},
);

health.openapi(
	createRoute({
		method: "get",
		path: "/live",
		responses: {
			200: {
				content: {
					"application/json": {
						schema: z.object({
							status: z.literal("alive"),
							timestamp: z.string(),
						}),
					},
				},
				description: "Service is alive",
			},
		},
	}),
	async (c) => {
		return c.json({
			status: "alive" as const,
			timestamp: new Date().toISOString(),
		});
	},
);

export default health;
