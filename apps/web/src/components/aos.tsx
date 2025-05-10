"use client";

import * as React from "react";

export function Aos() {
	React.useEffect(() => {
		import("aos").then((AOS) => AOS.init());
	}, []);

	return <></>;
}
