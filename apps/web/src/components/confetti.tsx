"use client";

import * as React from "react";
import ReactConfetti from "react-confetti";

export function Confetti({ id }: { id?: string | null }) {
	if (!id) return null;

	const [dimensions, setDimensions] = React.useState({
		width: window.innerWidth,
		height: window.innerHeight,
	});

	React.useEffect(() => {
		const handleResize = () => {
			setDimensions({
				width: window.innerWidth,
				height: window.innerHeight,
			});
		};

		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	return (
		<ReactConfetti
			key={id}
			run={Boolean(id)}
			recycle={false}
			numberOfPieces={500}
			width={dimensions.width}
			height={dimensions.height}
		/>
	);
}
