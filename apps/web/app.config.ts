import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "@tanstack/react-start/config";
import Icons from "unplugin-icons/vite";
import viteTsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
	tsr: {
		appDirectory: "src",
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
});
