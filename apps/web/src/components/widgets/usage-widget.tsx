import { cn } from "#/utils/cn.ts";
import * as LinkButton from "../ui/link-button.tsx";
import * as ProgressBar from "../ui/progress-bar.tsx";

type UsageWidgetProps = React.ComponentPropsWithRef<"div"> & {
	totalRequests?: number | null;
	remainingRequests?: bigint | null;
};

export function UsageWidget({
	totalRequests = 0,
	remainingRequests = BigInt(0),
	className,
	...props
}: UsageWidgetProps) {
	return (
		<div className={cn("w-full", className)} {...props}>
			<div className="space-y-1.5">
				<div className="flex justify-between gap-1.5">
					<span className="text-label-sm">
						Usage ({(totalRequests ?? 0) - Number(remainingRequests ?? 0)}/
						{totalRequests ?? 0})
					</span>
					<span className="text-(--text-sub-600) text-paragraph-xs">
						{Math.round(
							(((totalRequests ?? 0) - Number(remainingRequests ?? 0)) /
								(totalRequests ?? 0)) *
								100 || 0,
						)}
						%
					</span>
				</div>
				<ProgressBar.Root
					value={
						totalRequests
							? ((totalRequests - Number(remainingRequests ?? 0)) /
									totalRequests) *
								100
							: 0
					}
					max={100}
				/>
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
