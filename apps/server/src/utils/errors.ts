import { logger } from "#/lib/logger";

export function createErrorResponse(error: unknown, requestId: string) {
	logger.error({ err: error, requestId }, "request error");

	const sanitizedMessage = sanitizeErrorMessage(error);

	return {
		requestId,
		message: sanitizedMessage,
		code: "unknown",
	};
}

function sanitizeErrorMessage(error: unknown): string {
	const errorString = String(error);
	const errorMessage = error instanceof Error ? error.message : errorString;

	if (error instanceof Error) {
		if (
			errorMessage.includes("timeout") ||
			errorMessage.includes("ETIMEDOUT")
		) {
			return "Request timed out. Please try again.";
		}

		if (
			errorMessage.includes("ECONNREFUSED") ||
			errorMessage.includes("connection")
		) {
			return "Service temporarily unavailable. Please try again later.";
		}

		if (
			errorMessage.includes("rate limit") ||
			errorMessage.includes("too many requests")
		) {
			return "Rate limit exceeded. Please wait before trying again.";
		}

		if (
			errorMessage.includes("validation") ||
			errorMessage.includes("invalid")
		) {
			if (!containsSensitiveInfo(errorMessage)) {
				return errorMessage;
			}
		}
	}

	return "An unexpected error occurred. Please try again or contact support.";
}

function containsSensitiveInfo(message: string): boolean {
	const sensitivePatterns = [
		/\/[a-zA-Z0-9_\-\.\/]+/, // File paths
		/postgresql:\/\//, // Database URLs
		/redis:\/\//, // Redis URLs
		/mongodb:\/\//, // MongoDB URLs
		/mysql:\/\//, // MySQL URLs
		/sqlite:\/\//, // SQLite URLs
		/[a-zA-Z0-9]{32,}/, // Longer strings more likely to be tokens/keys
		/localhost:\d+/, // Local ports
		/127\.0\.0\.1/, // Local IPs
		/192\.168\./, // Private IPs
		/10\.0\./, // Private IPs
		/172\.1[6-9]\./, // Private IPs
		/NODE_ENV/, // Environment variables
		/process\.env/, // Environment access
		/password/i, // Password mentions
		/secret/i, // Secret mentions
		/token/i, // Token mentions
		/key.*=/i, // Key assignments
	];

	return sensitivePatterns.some((pattern) => pattern.test(message));
}
