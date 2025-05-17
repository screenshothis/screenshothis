import DocumentCode01Icon from "virtual:icons/hugeicons/document-code";

import { cn } from "#/utils/cn.ts";

export function ImageShowcaseSection({
	className,
	...props
}: React.ComponentPropsWithRef<"section">) {
	return (
		<section
			id="image-showcase"
			className={cn("px-2 lg:px-0", className)}
			{...props}
		>
			<div className="container max-w-6xl overflow-hidden border-x border-t bg-(--bg-white-0) py-12 lg:px-12">
				<div className="mx-auto max-w-xl text-center">
					<p
						data-aos="fade-up"
						data-aos-duration="1000"
						className="flex items-center justify-center gap-2"
					>
						<DocumentCode01Icon className="size-4 text-primary" />
						<span className="font-medium text-(--text-sub-600) text-paragraph-sm uppercase">
							create & customize
						</span>
					</p>

					<h3
						data-aos="fade-up"
						data-aos-duration="1000"
						className="mt-8 font-bold text-h4 tracking-tight"
					>
						Generate Your Perfect Screenshots
					</h3>
					<p
						data-aos="fade-up"
						data-aos-duration="1500"
						className="mt-2 text-(--text-sub-600) text-paragraph-lg"
					>
						Use our interactive playground to{" "}
						<span className="font-semibold">configure parameters</span>,{" "}
						<span className="font-semibold">preview results</span>, and{" "}
						<span className="font-semibold">instantly get</span> your screenshot
						URL.
					</p>
				</div>

				<div
					data-aos="fade-up"
					data-aos-duration="1000"
					className="relative pt-12"
				>
					<div className="mx-auto max-w-7xl px-6 pt-4 lg:px-8">
						<img
							alt="Dashboard Playground"
							className="mb-[-12%] rounded-12 shadow-2xl outline outline-(--stroke-soft-200)"
							height={864}
							src="/img/playground.png"
							width={1536}
						/>
					</div>
				</div>
			</div>
		</section>
	);
}
