"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import * as React from "react";

import { useORPC } from "#/hooks/use-orpc.ts";
import { useScreenshotDetails } from "#/store/screenshot-details.ts";
import * as Divider from "../ui/divider.tsx";
import * as Drawer from "../ui/drawer.tsx";
import { Skeleton } from "../ui/skeleton.tsx";

type SectionItem = { label: string; value: React.ReactNode };

function Section({
	title,
	items,
	loading,
}: {
	title: string;
	items: SectionItem[];
	loading?: boolean;
}) {
	return (
		<>
			<Divider.Root $type="solid-text">{title}</Divider.Root>

			<div className="grid gap-3 p-5">
				{items.map((item, i) => (
					<React.Fragment key={item.label}>
						<div className="grid gap-1">
							<div className="text-(--text-soft-400) text-subheading-xs uppercase">
								{item.label}
							</div>
							<div className="text-(--text-strong-950) text-label-sm">
								{loading ? (
									<Skeleton className="h-5 w-full max-w-60" />
								) : (
									item.value
								)}
							</div>
						</div>
						{i < items.length - 1 && <Divider.Root $type="line-spacing" />}
					</React.Fragment>
				))}
			</div>
		</>
	);
}

export function ScreenshotDetailsDrawer() {
	const { isOpen, screenshotId, close } = useScreenshotDetails();
	const orpc = useORPC();
	const {
		data: screenshot,
		isLoading,
		isError,
	} = useQuery({
		...orpc.screenshots.get.queryOptions({
			input: { id: screenshotId ?? "" },
		}),
		enabled: isOpen && Boolean(screenshotId),
	});

	return (
		<Drawer.Root open={isOpen} onOpenChange={(open) => !open && close()}>
			<Drawer.Content>
				<Drawer.Header>
					<Drawer.Title>Screenshot Details</Drawer.Title>
					<Drawer.Description>
						{screenshot?.url ? new URL(screenshot.url).host : ""}
					</Drawer.Description>
				</Drawer.Header>

				<Drawer.Body>
					{isError && (
						<p className="text-center text-(--text-danger-600)">
							Failed to load screenshot
						</p>
					)}

					{screenshot && (
						<div>
							<Section
								title="General"
								items={[
									{ label: "URL", value: screenshot.url },
									{ label: "Selector", value: screenshot.selector ?? "N/A" },
									{ label: "Format", value: screenshot.format },
									{
										label: "Duration",
										value:
											screenshot.duration !== undefined
												? `${screenshot.duration}s`
												: "N/A",
									},
									{
										label: "Created",
										value: screenshot.createdAt
											? format(screenshot.createdAt, "PPpp")
											: "N/A",
									},
								]}
								loading={isLoading}
							/>

							<Section
								title="Viewport"
								items={[
									{
										label: "Dimensions",
										value: `${screenshot.width}x${screenshot.height}`,
									},
									{
										label: "Mobile",
										value: screenshot.isMobile ? "Yes" : "No",
									},
									{
										label: "Landscape",
										value: screenshot.isLandscape ? "Yes" : "No",
									},
									{
										label: "Has Touch",
										value: screenshot.hasTouch ? "Yes" : "No",
									},
									{
										label: "Device Scale Factor",
										value: screenshot.deviceScaleFactor,
									},
								]}
								loading={isLoading}
							/>

							<Section
								title="Ads, tracking and more"
								items={[
									{
										label: "Block Ads",
										value: screenshot.blockAds ? "Yes" : "No",
									},
									{
										label: "Block Cookie Banners",
										value: screenshot.blockCookieBanners ? "Yes" : "No",
									},
									{
										label: "Block Trackers",
										value: screenshot.blockTrackers ? "Yes" : "No",
									},
									{
										label: "Block Requests",
										value: screenshot.blockRequests?.length
											? screenshot.blockRequests.join(", ")
											: "None",
									},
									{
										label: "Block Resources",
										value: screenshot.blockResources?.length
											? screenshot.blockResources.join(", ")
											: "None",
									},
								]}
								loading={isLoading}
							/>

							<Section
								title="Emulations"
								items={[
									{
										label: "Prefers Color Scheme",
										value: screenshot.prefersColorScheme,
									},
									{
										label: "Prefers Reduced Motion",
										value: screenshot.prefersReducedMotion,
									},
								]}
								loading={isLoading}
							/>
						</div>
					)}
				</Drawer.Body>
			</Drawer.Content>
		</Drawer.Root>
	);
}
