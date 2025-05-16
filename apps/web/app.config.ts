import contentCollections from "@content-collections/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "@tanstack/react-start/config";
import { generateSitemap } from "tanstack-router-sitemap";
import { FileSystemIconLoader } from "unplugin-icons/loaders";
import Icons from "unplugin-icons/vite";
import viteTsConfigPaths from "vite-tsconfig-paths";

import { sitemap } from "./src/utils/sitemap.ts";

export default defineConfig({
	server: {
		preset: "node-server",
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
				customCollections: {
					hugeicons: FileSystemIconLoader("./public/icons/hugeicons"),
				},
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
			contentCollections(),
			generateSitemap(sitemap),
		],
	},
});
