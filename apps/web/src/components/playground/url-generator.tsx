import * as React from "react";

import { CodeBlock } from "#/components/code-block.tsx";
import { cn } from "#/utils/cn.ts";
import {
	type PlaygroundFormValues,
	formatApiUrlForDisplay,
	generateApiUrl,
} from "#/utils/playground-utils.ts";

interface UrlGeneratorProps {
	values: PlaygroundFormValues;
	className?: string;
}

export function UrlGenerator({ values, className }: UrlGeneratorProps) {
	const formattedUrl = React.useMemo(() => {
		return formatApiUrlForDisplay(values);
	}, [values]);

	const cleanUrl = React.useMemo(() => {
		return generateApiUrl(values);
	}, [values]);

	return (
		<div className={cn("grid gap-3", className)}>
			<CodeBlock
				title="Generated URL"
				lang="bash"
				isCopyable
				textToCopy={cleanUrl}
				className="text-paragraph-xs"
				children={formattedUrl}
			/>

			<div className="grid gap-1 text-(--text-sub-600) text-paragraph-xs">
				<p>
					<strong>💡 Tip:</strong> The formatted URL above is for readability.
					The copy button copies the clean, single-line URL ready for API calls.
				</p>
			</div>
		</div>
	);
}
