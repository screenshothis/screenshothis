import { extendTailwindMerge } from "tailwind-merge";

export const twMergeConfig = {
	extend: {
		theme: {
			text: [
				"h1",
				"h2",
				"h3",
				"h4",
				"h5",
				"h6",
				"label-xl",
				"label-lg",
				"label-md",
				"label-sm",
				"label-xs",
				"paragraph-xl",
				"paragraph-lg",
				"paragraph-md",
				"paragraph-sm",
				"paragraph-xs",
				"subheading-md",
				"subheading-sm",
				"subheading-xs",
				"subheading-2xs",
			],
			radius: ["0", "4", "6", "8", "10", "12", "16", "20", "24", "full"],
		},
	},
};

export const twMerge = extendTailwindMerge(twMergeConfig);
