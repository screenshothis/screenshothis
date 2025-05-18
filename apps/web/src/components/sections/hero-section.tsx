import ArrowRight01Icon from "virtual:icons/hugeicons/arrow-right-01";

import { Link } from "@tanstack/react-router";

import { cn } from "#/utils/cn.ts";
import { Button } from "../ui/button.tsx";

export function HeroSection({
	className,
	...props
}: React.ComponentPropsWithRef<"section">) {
	return (
		<section
			id="hero"
			className={cn("relative px-2 lg:px-0", className)}
			{...props}
		>
			<div className="container relative max-w-6xl overflow-hidden border-x bg-(--bg-white-0) p-4 py-32 lg:px-8 lg:pb-80">
				<div
					aria-hidden="true"
					className="-mr-96 sm:-mr-80 lg:-mr-96 absolute inset-y-0 right-1/2 w-[200%] origin-top-right skew-x-[-30deg] bg-(--bg-white-0) shadow-orange-600/10 shadow-xl ring-1 ring-orange-50"
				/>

				<div className="relative">
					<div className="mx-auto max-w-2xl lg:mx-0 lg:shrink-0 lg:pt-8">
						<h1 className="text-pretty font-semibold text-h2 tracking-tighter lg:text-h1">
							Your All-in-One Screenshot Solution
						</h1>

						<p className="mt-4 text-pretty text-(--text-sub-600) lg:text-paragraph-lg">
							Whether you need to <strong>capture</strong>,{" "}
							<strong>store</strong>, or <strong>integrate screenshots</strong>,
							Screenshothis offers the tools you need with a simple API.
						</p>

						<div className="mt-12 flex items-center gap-2">
							<Button
								trailingIcon={ArrowRight01Icon}
								trailingIconClassName="easy-out-in duration-300 group-hover:translate-x-1"
								className="w-full gap-2 lg:w-auto"
								asChild
							>
								<Link to="/register">Get started now</Link>
							</Button>
							<Button
								trailingIcon={ArrowRight01Icon}
								trailingIconClassName="easy-out-in duration-300 group-hover:translate-x-1"
								$style="lighter"
								className="w-full gap-2 lg:w-auto"
								asChild
							>
								<a
									href="mailto:sales@screenshothis.com"
									target="_blank"
									rel="noreferrer noopener"
								>
									Contact sales
								</a>
							</Button>
						</div>
					</div>
				</div>

				<div className="-z-10 absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-(--bg-white-0) sm:h-32" />
			</div>
		</section>
	);
}
