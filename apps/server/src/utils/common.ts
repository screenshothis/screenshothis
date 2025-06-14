export function wait(
	milliseconds: number,
	signal?: AbortSignal,
): Promise<void> {
	return new Promise<void>((resolve, reject) => {
		const abortError = () => reject(new DOMException("Aborted", "AbortError"));

		// Validate input
		if (!Number.isFinite(milliseconds) || milliseconds < 0) {
			return reject(
				new RangeError("milliseconds must be a non-negative finite number"),
			);
		}

		// Handle already-aborted signals early
		if (signal?.aborted) {
			return abortError();
		}

		// Zero-delay: resolve immediately without scheduling a task
		if (milliseconds === 0) {
			return resolve();
		}

		const cleanup = () => {
			signal?.removeEventListener("abort", onAbort);
		};

		const timeout = setTimeout(() => {
			cleanup();
			resolve();
		}, milliseconds);

		const onAbort = () => {
			clearTimeout(timeout);
			cleanup();
			abortError();
		};

		signal?.addEventListener("abort", onAbort);
	});
}
