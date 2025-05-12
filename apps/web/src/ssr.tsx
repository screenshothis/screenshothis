import { getRouterManifest } from "@tanstack/react-start/router-manifest";
import {
	createStartHandler,
	defaultStreamHandler,
} from "@tanstack/react-start/server";

import { createRouter } from "./router.tsx";

export default createStartHandler({
	createRouter,
	getRouterManifest,
})(defaultStreamHandler);
