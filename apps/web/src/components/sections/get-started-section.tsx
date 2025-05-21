import CustomizeIcon from "virtual:icons/hugeicons/customize";
import SlidersVerticalIcon from "virtual:icons/hugeicons/sliders-vertical";
import Tap01Icon from "virtual:icons/hugeicons/tap-01";
import TestTube01Icon from "virtual:icons/hugeicons/test-tube-01";
import WebProtectionIcon from "virtual:icons/hugeicons/web-protection";
import ZoomInAreaIcon from "virtual:icons/hugeicons/zoom-in-area";

import "@vidstack/react/player/styles/base.css";
import "@vidstack/react/player/styles/plyr/theme.css";

import { MediaPlayer, MediaProvider } from "@vidstack/react";
import {
	PlyrLayout,
	plyrLayoutIcons,
} from "@vidstack/react/player/layouts/plyr";

import * as TabMenuVertical from "#/components/ui/tab-menu-vertical.tsx";
import { cn } from "#/utils/cn.ts";

const items = [
	{
		id: "authenticate",
		icon: WebProtectionIcon,
		label: "Authenticate: Get Your API Key",
		videoId: "get-started/1",
		features: [
			"Learn how to generate your unique API key in seconds.",
			"Understand the importance of keeping your API key secure.",
			"Quickly authenticate your requests to start capturing screenshots.",
		],
	},
	{
		id: "experiment",
		icon: TestTube01Icon,
		label: "Experiment: Using the Playground",
		videoId: "get-started/2",
		features: [
			"Visually configure all screenshot parameters without writing code.",
			"Instantly preview your screenshots before making an API call.",
			"Generate ready-to-use API request URLs directly from your settings.",
		],
	},
	{
		id: "refine",
		icon: CustomizeIcon,
		label: "Refine: Block Ads & Banners",
		videoId: "get-started/3",
		features: [
			"Capture cleaner, more professional screenshots by removing ads.",
			"Automatically eliminate distracting cookie banners and pop-ups.",
			"Focus your visuals purely on the essential web content you need.",
		],
	},
	{
		id: "adjust",
		icon: SlidersVerticalIcon,
		label: "Adjust: Viewport & Resolution",
		videoId: "get-started/4",
		features: [
			"Define precise browser dimensions (width & height) for consistent captures.",
			"Simulate different device viewports like desktop, mobile, or tablet.",
			"Control the output resolution and aspect ratio of your final images.",
		],
	},
	{
		id: "pinpoint",
		icon: ZoomInAreaIcon,
		label: "Pinpoint: Capture by CSS Selector",
		videoId: "get-started/5",
		features: [
			"Isolate and capture specific HTML elements on any webpage.",
			"Perfect for grabbing UI components, product images, or key sections.",
			"Utilize standard CSS selectors for precise and flexible targeting.",
		],
	},
];

export function GetStartedSection({
	className,
	...props
}: React.ComponentPropsWithRef<"section">) {
	return (
		<section
			id="get-started"
			className={cn("px-2 lg:px-0", className)}
			{...props}
		>
			<div className="container max-w-6xl border-x border-t bg-(--bg-white-0) py-12 lg:px-12">
				<TabMenuVertical.Root
					className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center lg:gap-24"
					defaultValue={items[0].id}
				>
					<div className="grid gap-8">
						<div>
							<p className="flex items-center gap-2">
								<Tap01Icon className="size-4 text-primary" />
								<span className="font-medium text-(--text-sub-600) text-paragraph-sm uppercase">
									API AT YOUR FINGERTIPS
								</span>
							</p>

							<h3 className="mt-8 font-semibold text-h4 tracking-tight">
								Unlock Powerful Screenshot Automation
							</h3>
							<p className="mt-2 text-(--text-sub-600) text-paragraph-lg">
								Generate, customize, and integrate website screenshots
								effortlessly with our robust API. From simple captures to
								complex configurations, see how to take charge of your visual
								assets.
							</p>
						</div>

						<TabMenuVertical.List>
							{items.map(({ id, label, icon }) => (
								<TabMenuVertical.Trigger key={id} value={id}>
									<TabMenuVertical.Icon as={icon} />
									{label}
								</TabMenuVertical.Trigger>
							))}
						</TabMenuVertical.List>
					</div>

					{items.map(({ id, label, videoId, features }) => (
						<TabMenuVertical.Content key={id} value={id}>
							<MediaPlayer
								className="fade-in plyr animate-in shadow-2xl duration-500"
								aspectRatio="3456/2160"
								title={label}
								src={[
									{
										src: `https://assets.screenshothis.com/${videoId}.mp4`,
										type: "video/mp4",
									},
									{
										src: `https://assets.screenshothis.com/${videoId}.webm`,
										type: "video/webm",
									},
								]}
							>
								<MediaProvider />
								<PlyrLayout icons={plyrLayoutIcons} />
							</MediaPlayer>

							<ul className="slide-in-from-bottom-5 mt-4 grid animate-in list-inside list-disc gap-3 px-4 duration-300 marker:text-primary">
								{features.map((feature) => (
									<li key={feature}>
										<span className="text-(--text-sub-600) text-paragraph-sm">
											{feature}
										</span>
									</li>
								))}
							</ul>
						</TabMenuVertical.Content>
					))}
				</TabMenuVertical.Root>
			</div>
		</section>
	);
}
