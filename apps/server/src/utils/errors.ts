export function createErrorResponse(error: unknown, requestId: string) {
	console.error(error);

	return {
		requestId,
		message: String(error),
		code: "unknown",
	};
}
