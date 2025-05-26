import Alert01SolidIcon from "virtual:icons/hugeicons/alert-01-solid";
import Image01Icon from "virtual:icons/hugeicons/image-01";
import Loading03Icon from "virtual:icons/hugeicons/loading-03";

import * as React from "react";

import { Button } from "#/components/ui/button.tsx";
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

	// Reset states when imageUrl changes
	React.useEffect(() => {
		setImageLoaded(false);
		setImageError(false);
	}, [imageUrl]);

	const handleCopyImage = React.useCallback(async () => {
		if (!imageUrl) return;

		try {
			const response = await fetch(imageUrl);
			const blob = await response.blob();
			await navigator.clipboard.write([
				new ClipboardItem({ [blob.type]: blob }),
			]);
		} catch (error) {
			console.warn("Failed to copy image:", error);
			// Fallback to copying URL
			await copyToClipboard(imageUrl);
		}
	}, [imageUrl]);

	const handleDownload = React.useCallback(() => {
		if (!imageUrl) return;

		const link = document.createElement("a");
		link.href = imageUrl;
		link.download = `screenshot-${Date.now()}.png`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}, [imageUrl]);

	return (
		<div
			className={cn(
				"grid gap-2 rounded-16 bg-(--bg-weak-50) p-2 lg:gap-3 lg:p-3",
				className,
			)}
		>
			<div className="flex items-center justify-between">
				<div className="font-medium font-mono text-(--text-sub-600) text-paragraph-xs tracking-normal md:text-paragraph-sm">
					Preview your screenshot 👇
				</div>

				{imageUrl && imageLoaded && !imageError && (
					<div className="flex gap-2">
						<Button
							$style="ghost"
							leadingIcon={Image01Icon}
							$size="sm"
							onClick={handleCopyImage}
						>
							Copy Image
						</Button>
						<Button $style="ghost" $size="sm" onClick={handleDownload}>
							Download
						</Button>
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
							alt="Generated screenshot"
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
