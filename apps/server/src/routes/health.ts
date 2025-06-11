import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { endTime, setMetric, startTime } from "hono/timing";

import type { Variables } from "../common/environment";
import { db } from "../db";
import { getQueueHealth } from "../lib/screenshot-queue";
import { storage } from "../lib/storage";
import { env } from "../utils/env";

const health = new OpenAPIHono<{ Variables: Variables }>();

const HealthCheckSchema = z
	.object({
		status: z.enum(["healthy", "degraded", "unhealthy"]).openapi({
			description: "Overall health status of the system",
			enum: ["healthy", "degraded", "unhealthy"],
		}),
		timestamp: z.string().openapi({
			description: "Timestamp of the health check",
		}),
		uptime: z.number().openapi({
			description: "Uptime of the service in seconds",
		}),
		checks: z
			.array(
				z.object({
					name: z.string().openapi({
						description: "Name of the health check",
					}),
					status: z.enum(["pass", "fail"]).openapi({
						description: "Status of the health check",
						enum: ["pass", "fail"],
					}),
					duration: z.number().optional().openapi({
						description: "Duration of the health check in milliseconds",
					}),
					details: z.record(z.any()).optional().openapi({
						description: "Detailed information about the health check",
					}),
					error: z.string().optional().openapi({
						description: "Error message if the health check failed",
					}),
				}),
			)
			.openapi({
				description: "Array of health check results",
			}),
		version: z.string().optional().openapi({
			description: "Application version or commit hash",
			example: "1.0.0",
		}),
	})
	.openapi("HealthCheck", {
		description:
			"Performs a comprehensive health check of all critical system components including database connectivity, storage availability, job queue status, and S3 functionality. Returns detailed status information for monitoring and alerting systems.",
		examples: [
			{
				status: "healthy",
				timestamp: "2024-01-01T00:00:00.000Z",
				uptime: 3600,
				checks: [
					{
						name: "database",
						status: "pass",
						duration: 12,
					},
					{
						name: "storage",
						status: "pass",
						duration: 25,
					},
					{
						name: "queue",
						status: "pass",
						duration: 8,
						details: {
							waiting: 2,
							active: 1,
							completed: 1543,
							failed: 0,
							workerRunning: true,
						},
					},
					{
						name: "s3",
						status: "pass",
						duration: 156,
					},
				],
				version: "1.0.0",
			},
			{
				status: "degraded",
				timestamp: "2024-01-01T00:00:00.000Z",
				uptime: 3600,
				checks: [
					{
						name: "database",
						status: "pass",
						duration: 15,
					},
					{
						name: "storage",
						status: "fail",
						duration: 5000,
						error: "Connection timeout",
					},
					{
						name: "queue",
						status: "pass",
						duration: 12,
					},
					{
						name: "s3",
						status: "pass",
						duration: 200,
					},
				],
				version: "1.0.0",
			},
			{
				status: "unhealthy",
				timestamp: "2024-01-01T00:00:00.000Z",
				uptime: 3600,
				checks: [
					{
						name: "database",
						status: "fail",
						duration: 5000,
						error: "Connection refused",
					},
					{
						name: "storage",
						status: "fail",
						duration: 5000,
						error: "Storage unavailable",
					},
					{
						name: "queue",
						status: "fail",
						duration: 100,
						error: "Queue worker not responding",
					},
					{
						name: "s3",
						status: "fail",
						duration: 3000,
						error: "S3 access denied",
					},
				],
				version: "1.0.0",
			},
		],
	});

health.openapi(
	createRoute({
		operationId: "health",
		summary: "Comprehensive health check",
		description:
			"Performs a comprehensive health check of all critical system components including database connectivity, storage availability, job queue status, and S3 functionality. Returns detailed status information for monitoring and alerting systems.",
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
					const health = await storage.healthCheck();
					if (!health.healthy) {
						throw new Error("Storage health check failed");
					}

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

			(async () => {
				const s3Start = Date.now();
				try {
					const testKey = `health-check/test-${Date.now()}.txt`;
					const testData = "health-check-data";

					await storage.write(testKey, testData);

					const file = storage.file(testKey);
					const readData = await file.arrayBuffer();
					const readText = new TextDecoder().decode(readData);

					await file.delete();

					if (readText !== testData) {
						throw new Error("S3 read/write test failed - data mismatch");
					}

					return {
						name: "s3",
						status: "pass" as const,
						duration: Date.now() - s3Start,
					};
				} catch (error) {
					return {
						name: "s3",
						status: "fail" as const,
						duration: Date.now() - s3Start,
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
		const failedChecks = healthChecks.filter(
			(check) => check.status === "fail",
		).length;
		const status: "healthy" | "degraded" | "unhealthy" =
			failedChecks === 0
				? "healthy"
				: failedChecks >= healthChecks.length
					? "unhealthy"
					: "degraded";

		const totalDuration = Date.now() - startTimestamp;
		setMetric(c, "health-check-duration", totalDuration);

		endTime(c, "health-check");

		const response = {
			status,
			timestamp: new Date().toISOString(),
			uptime: process.uptime(),
			checks: healthChecks,
			version: env.APP_VERSION || env.SOURCE_COMMIT,
		};

		return c.json(response, hasFailures ? 503 : 200);
	},
);

health.openapi(
	createRoute({
		operationId: "ready",
		summary: "Readiness probe",
		description:
			"Kubernetes-compatible readiness probe that verifies the service is ready to accept traffic. Checks database connectivity to ensure the service can handle requests. Used by orchestrators to determine when to route traffic to this instance.",
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
						example: {
							status: "ready",
							timestamp: "2024-01-01T00:00:00.000Z",
						},
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
						example: {
							status: "not ready",
							timestamp: "2024-01-01T00:00:00.000Z",
							error: "Database connection failed",
						},
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
		operationId: "live",
		summary: "Liveness probe",
		description:
			"Kubernetes-compatible liveness probe that indicates whether the service is alive and functioning. This lightweight check verifies the application is responsive and should be used by orchestrators to determine if the container needs to be restarted.",
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
						example: {
							status: "alive",
							timestamp: "2024-01-01T00:00:00.000Z",
						},
					},
				},
				description: "Service is alive",
			},
			503: {
				content: {
					"application/json": {
						schema: z.object({
							status: z.literal("not alive"),
							timestamp: z.string(),
							error: z.string(),
						}),
						example: {
							status: "not alive",
							timestamp: "2024-01-01T00:00:00.000Z",
							error: "Application unresponsive",
						},
					},
				},
				description: "Service is not alive",
			},
		},
	}),
	async (c) => {
		try {
			return c.json(
				{
					status: "alive" as const,
					timestamp: new Date().toISOString(),
				},
				200,
			);
		} catch (error) {
			return c.json(
				{
					status: "not alive" as const,
					timestamp: new Date().toISOString(),
					error: error instanceof Error ? error.message : "Unknown error",
				},
				503,
			);
		}
	},
);

export default health;
