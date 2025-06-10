import { defineConfig } from "tsdown";

export default defineConfig({
	entry: ["./src/**/*.ts"],
	dts: true,
	minify: true,
	exports: true,
	unbundle: true,
});
