"use client";

import ReactConfetti from "react-confetti";

export function Confetti({ id }: { id?: string | null }) {
	if (!id) return null;

	return (
		<ReactConfetti
			key={id}
			run={Boolean(id)}
			recycle={false}
			numberOfPieces={500}
			width={window.innerWidth}
			height={window.innerHeight}
		/>
	);
}
