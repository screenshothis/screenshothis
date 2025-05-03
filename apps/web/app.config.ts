import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "@tanstack/react-start/config";
import { cloudflare } from "unenv";
import Icons from "unplugin-icons/vite";
import viteTsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
	server: {
		preset: "cloudflare-pages",
		unenv: cloudflare,
	},
	tsr: {
		appDirectory: "src",
		autoCodeSplitting: true,
	},
	vite: {
		plugins: [
			Icons({
				compiler: "jsx",
				jsx: "react",
				autoInstall: true,
				iconCustomizer(_collection, _icon, props) {
					props.width = "1em";
					props.height = "1em";
					props["data-slot"] = "icon";
				},
			}),
			viteTsConfigPaths({
				projects: ["./tsconfig.json"],
			}),
			tailwindcss(),
		],
	},
	routers: {
		ssr: {
			middleware: "./src/middlewares/ssr.ts",
		},
	},
});
