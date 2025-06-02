import { logger } from "#/lib/logger";

export function createErrorResponse(error: unknown, requestId: string) {
	logger.error({ err: error, requestId }, "request error");

	return {
		requestId,
		message: String(error),
		code: "unknown",
	};
}
