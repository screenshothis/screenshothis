import {
	createStartHandler,
	defaultStreamHandler,
} from "@tanstack/react-start/server";

import { createRouter } from "./router.tsx";

export default createStartHandler({
	createRouter,
})(defaultStreamHandler);
