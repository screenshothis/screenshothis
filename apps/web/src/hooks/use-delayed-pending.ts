import { useSpinDelay } from "spin-delay";

/**
 * It gives you a nice way to show a loading spinner for
 * a minimum amount of time, even if the request finishes right after the delay.
 *
 * This avoids a flash of loading state regardless of how fast or slow the
 * request is.
 */
export function useDelayedPending({
	isPending = false,
	delay = 400,
	minDuration = 300,
}: { isPending?: boolean } & Parameters<typeof useSpinDelay>[1] = {}) {
	const delayedIsPending = useSpinDelay(isPending, {
		delay,
		minDuration,
	});
	return delayedIsPending;
}
