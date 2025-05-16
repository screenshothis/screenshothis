"use client";

import { useWindowSize } from "@uidotdev/usehooks";
import * as React from "react";
import ReactConfetti from "react-confetti";

export function Confetti({ id }: { id?: string | null }) {
	const { width, height } = useWindowSize();

	if (!id) return null;

	const prefersReducedMotion = React.useMemo(() => {
		if (typeof window === "undefined") return false;
		return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	}, []);

	return (
		<ReactConfetti
			key={id}
			run={Boolean(id)}
			recycle={false}
			numberOfPieces={prefersReducedMotion ? 50 : 500}
			width={width || 0}
			height={height || 0}
		/>
	);
}
