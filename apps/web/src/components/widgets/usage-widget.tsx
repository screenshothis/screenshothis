import { cn } from "#/utils/cn.ts";
import * as LinkButton from "../ui/link-button.tsx";
import * as ProgressBar from "../ui/progress-bar.tsx";

type UsageWidgetProps = React.ComponentPropsWithRef<"div"> & {
	totalRequests?: number | null;
	totalAllowedRequests?: number | bigint | null;
	remainingRequests?: number | bigint | null;
};

export function UsageWidget({
	totalRequests = 0,
	totalAllowedRequests = 0,
	remainingRequests = 0,
	className,
	...props
}: UsageWidgetProps) {
	const currentUsage = totalRequests ?? 0;
	const totalAllowed = Number(totalAllowedRequests ?? 0);

	const percentageUsed =
		totalAllowed > 0 ? Math.round((currentUsage / totalAllowed) * 100) : 0;
	const progressBarValue =
		totalAllowed > 0 ? (currentUsage / totalAllowed) * 100 : 0;

	return (
		<div className={cn("w-full", className)} {...props}>
			<div className="space-y-1.5">
				<div className="flex justify-between gap-1.5">
					<span className="text-label-sm">
						Usage ({currentUsage}/{totalAllowed})
					</span>
					<span className="text-(--text-sub-600) text-paragraph-xs">
						{percentageUsed}%
					</span>
				</div>
				<ProgressBar.Root value={progressBarValue} max={100} />
				<div className="text-(--text-sub-600) text-paragraph-xs">
					<LinkButton.Root $style="primary" $size="sm" $underline>
						Upgrade
					</LinkButton.Root>{" "}
					to unlock more screenshots.
				</div>
			</div>
		</div>
	);
}
