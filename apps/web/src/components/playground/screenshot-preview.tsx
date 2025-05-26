"use client";

import Alert01SolidIcon from "virtual:icons/hugeicons/alert-01-solid";
import Copy01Icon from "virtual:icons/hugeicons/copy-01";
import Image01Icon from "virtual:icons/hugeicons/image-01";
import ImageDownload02Icon from "virtual:icons/hugeicons/image-download-02";
import Loading03Icon from "virtual:icons/hugeicons/loading-03";
import Tick02Icon from "virtual:icons/hugeicons/tick-02";

import * as React from "react";

import * as CompactButton from "#/components/ui/compact-button.tsx";
import { Skeleton } from "#/components/ui/skeleton.tsx";
import { cn } from "#/utils/cn.ts";
import { copyToClipboard } from "#/utils/playground-utils.ts";

interface ScreenshotPreviewProps {
	imageUrl?: string;
	isLoading: boolean;
	error?: string;
	className?: string;
}

export function ScreenshotPreview({
	imageUrl,
	isLoading,
	error,
	className,
}: ScreenshotPreviewProps) {
	const [imageLoaded, setImageLoaded] = React.useState(false);
	const [imageError, setImageError] = React.useState(false);
	const [isCopied, setCopied] = React.useState(false);

	// Reset states when imageUrl changes
	React.useEffect(() => {
		setImageLoaded(false);
		setImageError(false);
	}, [imageUrl]);

	const handleCopyImage = React.useCallback(async () => {
		if (!imageUrl) return;

		try {
			// Check if clipboard API is available
			if (!navigator.clipboard) {
				await copyToClipboard(imageUrl);
				return;
			}

			// Convert image to PNG for better clipboard compatibility
			const canvas = document.createElement("canvas");
			const ctx = canvas.getContext("2d");
			const img = new Image();

			await new Promise((resolve, reject) => {
				img.onload = resolve;
				img.onerror = reject;
				img.src = imageUrl;
			});

			canvas.width = img.width;
			canvas.height = img.height;
			ctx?.drawImage(img, 0, 0);

			canvas.toBlob(async (blob) => {
				if (blob) {
					await navigator.clipboard.write([
						new ClipboardItem({ "image/png": blob }),
					]);
				}
			}, "image/png");
		} catch (error) {
			console.warn("Failed to copy image:", error);
			// Fallback to copying the URL/data URL as text
			try {
				await copyToClipboard(imageUrl);
			} catch (fallbackError) {
				console.error("Failed to copy URL as fallback:", fallbackError);
			}
		} finally {
			setCopied(true);
			setTimeout(() => setCopied(false), 3000);
		}
	}, [imageUrl]);

	const handleDownload = React.useCallback(() => {
		if (!imageUrl) return;

		try {
			const link = document.createElement("a");
			link.href = imageUrl;

			// For base64 images, extract format from data URL or default to png
			const extension = imageUrl.startsWith("data:image/")
				? imageUrl.split(";")[0].split("/")[1] || "png"
				: "png";

			link.download = `screenshot-${Date.now()}.${extension}`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		} catch (error) {
			console.error("Failed to download image:", error);
		}
	}, [imageUrl]);

	return (
		<div
			className={cn(
				"grid gap-2 rounded-16 bg-(--bg-weak-50) p-2 lg:gap-3 lg:p-3",
				className,
			)}
		>
			<div className="flex items-center justify-between px-2">
				<div className="font-medium font-mono text-(--text-sub-600) text-paragraph-xs tracking-normal md:text-paragraph-sm">
					Preview your screenshot 👇
				</div>

				{imageUrl && imageLoaded && !imageError && (
					<div className="flex gap-2">
						<CompactButton.Root $style="ghost" onClick={handleCopyImage}>
							<CompactButton.Icon
								className="size-5"
								as={isCopied ? Tick02Icon : Copy01Icon}
							/>
							<span className="sr-only">
								{isCopied ? "Copied!" : "Copy image"}
							</span>
						</CompactButton.Root>

						<CompactButton.Root $style="ghost" onClick={handleDownload}>
							<CompactButton.Icon className="size-5" as={ImageDownload02Icon} />
							<span className="sr-only">Download</span>
						</CompactButton.Root>
					</div>
				)}
			</div>

			<div
				className={cn(
					"w-full rounded-10 bg-(--bg-white-0) transition-all duration-300",
					!imageUrl && "aspect-video",
				)}
			>
				{isLoading ? (
					<div className="flex h-full min-h-[200px] w-full items-center justify-center">
						<div className="flex flex-col items-center gap-3">
							<Loading03Icon className="size-8 animate-spin text-(--text-sub-600)" />
							<p className="text-(--text-sub-600) text-paragraph-sm">
								Generating screenshot...
							</p>
						</div>
					</div>
				) : error ? (
					<div className="flex h-full min-h-[200px] w-full items-center justify-center">
						<div className="flex max-w-sm flex-col items-center gap-3 text-center">
							<Alert01SolidIcon className="size-8 text-state-error-base" />
							<div>
								<p className="mb-1 font-medium text-paragraph-sm text-state-error-base">
									Failed to generate screenshot
								</p>
								<p className="text-(--text-sub-600) text-paragraph-xs">
									{error}
								</p>
							</div>
						</div>
					</div>
				) : imageUrl ? (
					<div className="relative">
						{!imageLoaded && !imageError && (
							<Skeleton className="absolute inset-0 h-full w-full rounded-10" />
						)}
						<img
							src={imageUrl}
							alt={
								imageError
									? "Failed to load screenshot"
									: "Generated screenshot"
							}
							loading="lazy"
							decoding="async"
							className={cn(
								"w-full rounded-10 transition-opacity duration-300",
								imageLoaded ? "opacity-100" : "opacity-0",
							)}
							onLoad={() => setImageLoaded(true)}
							onError={() => setImageError(true)}
						/>
						{imageError && (
							<div className="absolute inset-0 flex items-center justify-center rounded-10 bg-(--bg-white-0)">
								<div className="flex flex-col items-center gap-2 text-center">
									<Alert01SolidIcon className="size-6 text-state-error-base" />
									<p className="text-(--text-sub-600) text-paragraph-sm">
										Failed to load image
									</p>
								</div>
							</div>
						)}
					</div>
				) : (
					<div className="flex h-full min-h-[200px] w-full items-center justify-center">
						<div className="flex flex-col items-center gap-3 text-center">
							<Image01Icon className="size-8 text-(--text-sub-600)" />
							<p className="text-(--text-sub-600) text-paragraph-sm">
								No screenshot generated yet
							</p>
							<p className="max-w-xs text-(--text-sub-600) text-paragraph-xs">
								Fill in the URL and API key, then click "Generate image" to see
								your screenshot
							</p>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
