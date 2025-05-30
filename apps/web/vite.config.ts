import contentCollections from "@content-collections/vite";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { generateSitemap } from "tanstack-router-sitemap";
import { FileSystemIconLoader } from "unplugin-icons/loaders";
import Icons from "unplugin-icons/vite";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

import { sitemap } from "#/utils/sitemap.ts";

export default defineConfig({
	server: {
		port: 3001,
	},
	plugins: [
		generateSitemap(sitemap),
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
		tailwindcss(),
		tsConfigPaths({
			projects: ["./tsconfig.json"],
		}),
		tanstackStart({ target: "node-server" }),
		contentCollections(),
	],
});
