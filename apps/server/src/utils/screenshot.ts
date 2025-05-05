import type { R2Bucket, R2ObjectBody } from "@cloudflare/workers-types";
import { Cloudflare } from "cloudflare";

interface ScreenshotOptions {
	url: string;
	width: number;
	height: number;
	format: string;
	accountId: string;
	apiToken: string;
	bucket: R2Bucket;
}

function getScreenshotKey(
	url: string,
	width: number,
	height: number,
	format: string,
) {
	// Use a simple deterministic key based on params
	const safeUrl = encodeURIComponent(url);
	return `screenshots/${safeUrl}_${width}x${height}.${format}`;
}

export async function getOrCreateScreenshot({
	url,
	width,
	height,
	format,
	accountId,
	apiToken,
	bucket,
}: ScreenshotOptions): Promise<{
	object: R2ObjectBody | null;
	key: string;
	created: boolean;
}> {
	const key = getScreenshotKey(url, width, height, format);
	let object: R2ObjectBody | null = null;
	try {
		object = await bucket.get(key);
		if (object) {
			return { object, key, created: false };
		}
	} catch {}

	const cloudflare = new Cloudflare({ apiToken });
	const screenshotResult = await cloudflare.browserRendering.screenshot.create({
		account_id: accountId,
		url,
		screenshotOptions: { encoding: "base64" },
		viewport: { width, height },
	});

	if (typeof screenshotResult !== "string") {
		return { object: null, key, created: false };
	}
	const screenshot: string = screenshotResult;

	const parsedBase64Image = screenshot.split("base64,")[1];
	if (!parsedBase64Image) {
		return { object: null, key, created: false };
	}

	let imageBuffer: ArrayBuffer;
	try {
		const nodeBuffer = Buffer.from(parsedBase64Image, "base64");
		imageBuffer = nodeBuffer.buffer;
	} catch {
		return { object: null, key, created: false };
	}

	const contentType = `image/${format}`;
	try {
		await bucket.put(key, imageBuffer, { httpMetadata: { contentType } });
	} catch {
		return { object: null, key, created: false };
	}

	try {
		object = await bucket.get(key);
		if (object) {
			return { object, key, created: true };
		}
	} catch {}

	return { object: null, key, created: false };
}
