import ArrowRight01Icon from "virtual:icons/hugeicons/arrow-right-01";
import CreditCardIcon from "virtual:icons/hugeicons/credit-card";

import { cn } from "#/utils/cn.ts";
import type { Format } from "@number-flow/react";
import { resolveCurrencyFormat } from "@sumup/intl";
import * as React from "react";
import { Button } from "../ui/button.tsx";

type PricingSectionProps = React.ComponentPropsWithRef<"section"> & {
	containerClassName?: string;
};

export function PricingSection({
	containerClassName,
	...props
}: PricingSectionProps) {
	const currencyFormat = resolveCurrencyFormat("en", "USD");
	const format: Format = React.useMemo(
		() => ({
			style: "currency",
			currency: "USD",
			minimumFractionDigits: currencyFormat?.minimumFractionDigits,
			maximumFractionDigits: currencyFormat?.maximumFractionDigits,
		}),
		[
			currencyFormat?.maximumFractionDigits,
			currencyFormat?.minimumFractionDigits,
		],
	);

	return (
		<section {...props}>
			<div
				className={cn(
					"container max-w-6xl border-x border-t bg-(--bg-white-0) py-12 lg:px-12",
					containerClassName,
				)}
			>
				<div className="grid grid-cols-1 items-end gap-8 lg:grid-cols-3">
					<div className="lg:col-span-2">
						<p
							data-aos="fade-up"
							data-aos-duration="1000"
							className="flex items-center gap-2"
						>
							<CreditCardIcon className="size-4 text-primary" />
							<span className="font-medium text-(--text-sub-600) text-paragraph-sm uppercase">
								pricing
							</span>
						</p>

						<h3
							data-aos="fade-up"
							data-aos-duration="1000"
							className="mt-8 font-bold text-h4 tracking-tight"
						>
							Simple Pricing
						</h3>
						<p
							data-aos="fade-up"
							data-aos-duration="1500"
							className="mt-2 text-(--text-sub-600) text-paragraph-lg"
						>
							Find the perfect plan for your screenshot needs. Start small and{" "}
							<strong>easily scale up</strong> as your usage grows, from{" "}
							<strong>individual projects</strong> to enterprise-level demands.
						</p>
					</div>

					<div className="flex lg:ml-auto">
						<Button
							asChild
							trailingIcon={ArrowRight01Icon}
							trailingIconClassName="easy-out-in duration-300 group-hover:translate-x-1"
							className="w-full gap-2 lg:w-auto"
						>
							<a
								href="mailto:sales@expensetrackr.app"
								target="_blank"
								rel="noreferrer noopener"
							>
								Contact sales
							</a>
						</Button>
					</div>
				</div>
			</div>
		</section>
	);
}
