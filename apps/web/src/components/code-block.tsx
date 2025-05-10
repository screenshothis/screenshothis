"use client";

import Copy01Icon from "virtual:icons/hugeicons/copy-01";
import Tick02Icon from "virtual:icons/hugeicons/tick-02";

import { useCopyToClipboard } from "@uidotdev/usehooks";
import * as React from "react";
import { type BundledLanguage, createOnigurumaEngine } from "shiki";

import * as CompactButton from "#/components/ui/compact-button.tsx";
import { cn } from "#/utils/cn.ts";

export type CodeBlockProps = React.ComponentPropsWithRef<"pre"> & {
	wrapperClassName?: string;
	wrapperProps?: React.ComponentPropsWithRef<"div"> & {
		"data-aos"?: string;
		"data-aos-duration"?: string;
	};
	children?: string;
	lang: BundledLanguage;
	title?: string;
	isCopyable?: boolean;
	textToCopy?: string;
	isRevealable?: boolean;
	revealableText?: string;
};

export const CodeBlock = (props: CodeBlockProps) => {
	const {
		wrapperClassName,
		wrapperProps,
		children: code,
		lang,
		className,
		title,
		isCopyable,
		textToCopy,
		isRevealable,
		revealableText,
		...rest
	} = props;

	const [highlightedCode, setHighlightedCode] = React.useState<string>();
	const [, copyToClipboard] = useCopyToClipboard();
	const [isCopied, setCopied] = React.useState(false);

	React.useEffect(() => {
		if (!code) {
			return;
		}

		// https://shiki.style/guide/install#fine-grained-bundle
		import("shiki/core").then(async ({ createHighlighterCore }) => {
			const highlighter = await createHighlighterCore({
				themes: [
					import("shiki/themes/github-light.mjs"),
					import("shiki/themes/github-dark.mjs"),
				],
				langs: [import("shiki/langs/bash.mjs")],
				engine: createOnigurumaEngine(import("shiki/wasm")),
			});

			setHighlightedCode(
				highlighter.codeToHtml(code, {
					themes: {
						light: "github-light",
						dark: "github-dark",
					},
					lang,
				}),
			);
		});
	}, [code, lang]);

	const handleCopy = () => {
		if (!textToCopy || !code) {
			return;
		}

		copyToClipboard(textToCopy ?? code);
		setCopied(true);

		setTimeout(() => setCopied(false), 3000);
	};

	if (!code) {
		return null;
	}

	return (
		<div
			{...wrapperProps}
			className={cn(
				"flex flex-col gap-2 rounded-20 bg-(--bg-weak-50) p-2 md:gap-3 md:p-3",
				wrapperClassName,
			)}
		>
			{title || isCopyable ? (
				<div className="flex w-full items-center justify-between px-2">
					{title ? (
						<div className="font-medium font-mono text-(--text-sub-600) text-paragraph-xs tracking-normal md:text-paragraph-sm">
							{title}
						</div>
					) : null}

					{isCopyable ? (
						<CompactButton.Root
							type="button"
							onClick={handleCopy}
							$style="ghost"
						>
							<CompactButton.Icon
								className="size-4"
								as={isCopied ? Tick02Icon : Copy01Icon}
							/>
							<span className="sr-only">{isCopied ? "Copied" : "Copy"}</span>
						</CompactButton.Root>
					) : null}
				</div>
			) : null}

			<pre
				className={cn(
					"relative overflow-x-auto rounded-12 text-paragraph-xs",
					className,
				)}
				{...rest}
			>
				{highlightedCode ? (
					// biome-ignore lint/security/noDangerouslySetInnerHtml: we control the input
					<code dangerouslySetInnerHTML={{ __html: highlightedCode }} />
				) : (
					<code>{code}</code>
				)}
			</pre>
		</div>
	);
};
