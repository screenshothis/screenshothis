import { objectToCamel } from "ts-case-convert";
import * as v from "valibot";

export const takeScreenshotSchema = v.pipe(
	v.object({
		url: v.pipe(
			v.string(),
			v.nonEmpty("Please enter your url."),
			v.url("The url is badly formatted."),
		),
		width: v.optional(v.pipe(v.unknown(), v.transform(Number)), 1920),
		height: v.optional(v.pipe(v.unknown(), v.transform(Number)), 1080),
		format: v.optional(v.picklist(["jpeg", "png", "webp"]), "jpeg"),
		block_ads: v.pipe(
			v.optional(v.string(), "true"),
			v.transform((value) => value === "true"),
		),
		block_cookie_banners: v.pipe(
			v.optional(v.string(), "true"),
			v.transform((value) => value === "true"),
		),
		block_trackers: v.pipe(
			v.optional(v.string(), "true"),
			v.transform((value) => value === "true"),
		),
	}),
	v.transform((data) => objectToCamel(data)),
);
