"use client";

import * as React from "react";

import { highlight } from "#/utils/highlight.ts";

export function CodeBlock({ initial }: { initial?: React.JSX.Element }) {
	const [nodes, setNodes] = React.useState(initial);

	React.useLayoutEffect(() => {
		void highlight('console.log("Rendered on client")', "ts").then(setNodes);
	}, []);

	return nodes ?? <p>Loading...</p>;
}
