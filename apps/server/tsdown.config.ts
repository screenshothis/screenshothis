import { defineConfig } from "tsdown";

export default defineConfig({
	entry: ["./src/index.ts"],
	minify: true,
	sourcemap: true,
	outDir: "dist",
});
