import { Link } from "@tanstack/react-router";

import { useMe } from "#/hooks/use-me.ts";
import { cn } from "#/utils/cn.ts";
import { plans } from "#/utils/plans.ts";
import * as LinkButton from "../ui/link-button.tsx";
import * as ProgressBar from "../ui/progress-bar.tsx";

type UsageWidgetProps = React.ComponentPropsWithRef<"div">;

export function UsageWidget({ className, ...props }: UsageWidgetProps) {
	const me = useMe();

	const requestLimits = me?.requestLimits;

	const usedRequests = requestLimits?.totalRequests ?? 0;
	const totalAllowed = requestLimits?.totalAllowedRequests ?? 0;

	const currentUsage = usedRequests;

	const percentageUsed =
		totalAllowed > 0 ? Math.round((currentUsage / totalAllowed) * 100) : 0;
	const progressBarValue =
		totalAllowed > 0 ? (currentUsage / totalAllowed) * 100 : 0;

	return (
		<div className={cn("w-full", className)} {...props}>
			<div className="space-y-1.5">
				<div className="flex justify-between gap-1.5">
					<span className="text-label-sm">
						Usage ({usedRequests}/{totalAllowed})
					</span>
					<span className="text-(--text-sub-600) text-paragraph-xs">
						{percentageUsed}%
					</span>
				</div>
				<ProgressBar.Root value={progressBarValue} max={100} />
				{(requestLimits?.plan === "free" || percentageUsed >= 80) && (
					<div className="text-(--text-sub-600) text-paragraph-xs">
						<LinkButton.Root $style="primary" $size="sm" $underline asChild>
							<Link to="/" hash="pricing">
								Upgrade
							</Link>
						</LinkButton.Root>{" "}
						to unlock more screenshots.
					</div>
				)}

				{requestLimits?.plan &&
					requestLimits.plan !== "free" &&
					plans[requestLimits.plan]?.extraScreenshotsCost && (
						<div className="text-(--text-sub-600) text-paragraph-xs">
							Each extra screenshot costs{" "}
							{plans[requestLimits.plan].extraScreenshotsCost} USD.
						</div>
					)}
			</div>
		</div>
	);
}
