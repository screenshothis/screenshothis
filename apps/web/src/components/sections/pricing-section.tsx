import ArrowRight01Icon from "virtual:icons/hugeicons/arrow-right-01";
import CheckmarkCircle02SolidIcon from "virtual:icons/hugeicons/checkmark-circle-02-solid";
import CreditCardIcon from "virtual:icons/hugeicons/credit-card";
import InformationCircleSolidIcon from "virtual:icons/hugeicons/information-circle-solid";

import type { Format } from "@number-flow/react";
import NumberFlow from "@number-flow/react";
import { resolveCurrencyFormat } from "@sumup/intl";
import { Link, useRouteContext } from "@tanstack/react-router";
import * as React from "react";

import { cn } from "#/utils/cn.ts";
import { env } from "#/utils/env.client.ts";
import { type Plan, plans } from "#/utils/plans.ts";
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
		<section id="pricing" {...props}>
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

				<div className="mx-auto mt-12 grid gap-2.5">
					<div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
						{Object.entries(plans).map(([key, plan]) => {
							return (
								<div
									data-aos="fade-up"
									data-aos-duration={
										// if is first or last 1000 otherwise 1500
										key === "lite" || key === "enterprise" ? "1250" : "1000"
									}
									className={cn(
										"rounded-24 p-8 shadow-sm",
										plan.isFeatured
											? "bg-primary"
											: "bg-(--bg-white-0) ring-(--stroke-soft-200)/40 ring-1 ring-inset",
									)}
									key={key}
								>
									<div className="block flex-shrink-0">
										<p
											className={cn(
												"font-medium",
												plan.isFeatured ? "text-white" : "",
											)}
										>
											{plan.name}
										</p>
									</div>

									<div className="mt-6">
										<p
											className={cn(
												"text-paragraph-sm",
												plan.isFeatured
													? "text-white"
													: "text-(--text-sub-600)",
											)}
										>
											{/* {plan.description} */}
										</p>
										<p className="mt-8 h-15 font-semibold tracking-tight">
											{key === "enterprise" ? (
												<span className="font-semibold text-h4 lg:text-h3">
													Custom
												</span>
											) : (
												<NumberFlow
													className={cn(
														"font-semibold text-h4 lg:text-h3 [&::part(suffix)]:font-normal [&::part(suffix)]:text-(--text-sub-600) [&::part(suffix)]:text-paragraph-xs",
														plan.isFeatured
															? "text-white [&::part(suffix)]:text-white"
															: "",
													)}
													suffix="/month"
													format={format}
													value={plan.price || 0}
												/>
											)}
										</p>
									</div>

									<div className="mt-8">
										<PlanButton planKey={key} plan={plan} />
									</div>

									<ul className="order-last mt-10 flex flex-col gap-y-3">
										{plan.features.map((feature) => (
											<li className="flex items-start gap-2" key={feature}>
												<CheckmarkCircle02SolidIcon
													className={cn(
														"mt-0.5 size-4",
														plan.isFeatured
															? "text-white"
															: "text-(--text-sub-600)",
													)}
												/>
												<span
													className={cn(
														"flex-1 text-paragraph-sm",
														plan.isFeatured
															? "text-white"
															: "text-(--text-sub-600)",
													)}
													// biome-ignore lint/security/noDangerouslySetInnerHtml: we control the content
													dangerouslySetInnerHTML={{ __html: feature }}
												/>
											</li>
										))}
										<li className="flex items-start gap-2">
											<InformationCircleSolidIcon
												className={cn(
													"mt-0.5 size-4",
													plan.isFeatured
														? "text-white"
														: "text-(--text-sub-600)",
												)}
											/>
											<span
												className={cn(
													"flex-1 text-paragraph-sm",
													plan.isFeatured
														? "text-white"
														: "text-(--text-sub-600)",
												)}
											>
												{plan.extraScreenshotsCost
													? `Additional screenshots cost ${plan.extraScreenshotsCost} USD each`
													: ""}
											</span>
										</li>
									</ul>
								</div>
							);
						})}
					</div>

					<p className="text-(--text-sub-600) text-paragraph-sm">
						<sup className="text-primary">1</sup> We only charge per screenshot
						generated, not cached ones.
					</p>
				</div>
			</div>
		</section>
	);
}

function PlanButton({ plan, planKey }: { plan: Plan; planKey: string }) {
	const context = useRouteContext({
		from: "__root__",
	});
	const isLoggedIn = !!context.session?.id;

	// TODO: this is handy for now, but we should use the auth client to handle this
	const handleSubscribe = async () => {
		const response = await fetch(
			`${env.VITE_SERVER_URL}/auth/checkout/${planKey}`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					slug: planKey,
				}),
				credentials: "include",
				redirect: "follow",
			},
		);

		if (response.ok) {
			const data = (await response.json()) as { url: string };

			window.location.href = data.url;
		}
	};

	return (
		<Button
			$style={plan.buttonStyle}
			$type={plan.buttonType}
			asChild={isLoggedIn}
			className={cn(
				"w-full",
				plan.isFeatured &&
					"bg-white text-primary hover:bg-orange-600 hover:text-white",
			)}
			onClick={isLoggedIn ? handleSubscribe : undefined}
		>
			{planKey === "enterprise" ? (
				<a href="mailto:sales@expensetrackr.app">{plan.buttonLabel}</a>
			) : isLoggedIn ? (
				plan.buttonLabel
			) : (
				<Link to="/register">{plan.buttonLabel}</Link>
			)}
		</Button>
	);
}
