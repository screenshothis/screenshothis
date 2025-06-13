export function wait(
	milliseconds: number,
	signal?: AbortSignal,
): Promise<void> {
	return new Promise<void>((resolve, reject) => {
		// If the caller provided an AbortSignal and it is already aborted, short-circuit
		if (signal?.aborted) {
			return reject(new Error("Aborted"));
		}

		const timeout = setTimeout(() => {
			cleanup();
			resolve();
		}, milliseconds);

		const onAbort = () => {
			clearTimeout(timeout);
			cleanup();
			reject(new Error("Aborted"));
		};

		const cleanup = () => {
			signal?.removeEventListener("abort", onAbort);
		};

		signal?.addEventListener("abort", onAbort);
	});
}
