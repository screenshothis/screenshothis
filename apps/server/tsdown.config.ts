import { defineConfig } from "tsdown";

export default defineConfig({
	minify: true,
	sourcemap: true,
	unbundle: true,
	noExternal: ["better-auth-harmony"],
});
