import ThirdBracketSquareIcon from "virtual:icons/hugeicons/3rd-bracket-square";
import ArrowRight01Icon from "virtual:icons/hugeicons/arrow-right-01";
import ArtboardToolIcon from "virtual:icons/hugeicons/artboard-tool";
import ChipIcon from "virtual:icons/hugeicons/chip";
import CleanIcon from "virtual:icons/hugeicons/clean";
import Clock01Icon from "virtual:icons/hugeicons/clock-01";
import GroupItemsIcon from "virtual:icons/hugeicons/group-items";
import Image02Icon from "virtual:icons/hugeicons/image-02";
import MouseScroll01Icon from "virtual:icons/hugeicons/mouse-scroll-01";
import Settings02Icon from "virtual:icons/hugeicons/settings-02";

import { Link } from "@tanstack/react-router";

import { Button } from "../ui/button.tsx";

const features = [
	{
		icon: MouseScroll01Icon,
		id: "full-page-capture",
		title: "Full Page Capture",
		description:
			"Capture the entire scrollable length of any webpage, from top to bottom, in a single, comprehensive image.",
	},
	{
		icon: ArtboardToolIcon,
		id: "custom-viewports",
		title: "Custom Viewports",
		description:
			"Define exact browser window dimensions (width & height) or capture the visible area for precise framing of your screenshots.",
	},
	{
		icon: GroupItemsIcon,
		id: "element-specific-shots",
		title: "Element-Specific Shots",
		description:
			"Target and screenshot specific HTML elements using CSS selectors for focused visual content, perfect for UI details.",
	},
	{
		icon: Image02Icon,
		id: "format-quality-control",
		title: "Format & Quality Control",
		description:
			"Choose your preferred image format (JPEG, PNG), adjust compression quality, and optimize screenshots for your specific needs.",
	},
	{
		icon: Clock01Icon,
		id: "smart-delays-timing",
		title: "Smart Delays & Timing",
		description:
			"Implement custom delays to ensure dynamic content, animations, or lazy-loaded elements are fully rendered before capture.",
	},
	{
		icon: CleanIcon,
		id: "clean-clear-captures",
		title: "Clean & Clear Captures",
		description:
			"Automatically block common ads, cookie banners, and trackers for cleaner, more professional-looking screenshots.",
	},
	{
		icon: Settings02Icon,
		id: "advanced-configuration",
		title: "Advanced Configuration",
		description:
			"Set custom user agents, HTTP headers, and other advanced parameters to simulate different devices or browsing scenarios.",
	},
	{
		icon: ThirdBracketSquareIcon,
		id: "seamless-api-integration",
		title: "Seamless API Integration",
		description:
			"Effortlessly integrate with our well-documented REST API and get generated URLs for immediate use in your applications and workflows.",
	},
];

export function FeaturesSection(props: React.ComponentPropsWithRef<"section">) {
	return (
		<section id="features" {...props}>
			<div className="container max-w-6xl border-x border-t bg-(--bg-white-0) py-12 lg:px-12">
				<div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:items-end">
					<div className="lg:col-span-2">
						<p
							data-aos="fade-up"
							data-aos-duration="1000"
							className="flex items-center gap-2"
						>
							<ChipIcon className="size-4 text-primary" />
							<span className="font-medium text-(--text-sub-600) text-paragraph-sm uppercase">
								YOUR SCREENSHOT AUTOMATION HUB
							</span>
						</p>

						<h3
							data-aos="fade-up"
							data-aos-duration="1000"
							className="mt-8 font-semibold text-h4 tracking-tight"
						>
							Powerful Screenshots, Programmatically Controlled
						</h3>
						<p
							data-aos="fade-up"
							data-aos-duration="1500"
							className="mt-2 text-(--text-sub-600) text-paragraph-lg"
						>
							Capture any webpage, customize every detail, and integrate
							stunning visuals into your applications with our robust,
							developer-friendly API—no more manual captures or inconsistent
							results.
						</p>

						<div
							data-aos="fade-up"
							data-aos-duration="2000"
							className="mt-8 flex items-center gap-2"
						>
							<Button
								asChild
								trailingIcon={ArrowRight01Icon}
								trailingIconClassName="easy-out-in duration-300 group-hover:translate-x-1"
								className="gap-2"
							>
								<Link to="/register">Get started now</Link>
							</Button>
							<Button
								$style="lighter"
								trailingIcon={ArrowRight01Icon}
								trailingIconClassName="easy-out-in duration-300 group-hover:translate-x-1"
								asChild
								className="gap-2"
							>
								<Link to="/">Contact sales </Link>
							</Button>
						</div>
					</div>
				</div>

				<dl className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
					{features.map((feature) => (
						<div key={feature.id}>
							<dt className="flex items-center gap-2">
								<feature.icon className="size-6 text-primary" />
								<h3 className="font-medium text-paragraph-sm">
									{feature.title}
								</h3>
							</dt>
							<dd>
								<p className="mt-2 text-(--text-sub-600) text-paragraph-sm">
									{feature.description}
								</p>
							</dd>
						</div>
					))}
				</dl>
			</div>
		</section>
	);
}
