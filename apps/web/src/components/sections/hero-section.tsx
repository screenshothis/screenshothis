import ArrowRight01Icon from "virtual:icons/hugeicons/arrow-right-01";

import { Link } from "@tanstack/react-router";

import { Button } from "#/components/ui/button.tsx";

export function HeroSection() {
	return (
		<section id="hero" className="relative">
			<div className="container relative max-w-6xl overflow-hidden border-x bg-(--bg-white-0) p-4 py-32 lg:px-8 lg:pb-80 2xl:max-w-[1400px]">
				<div
					aria-hidden="true"
					className="-mr-96 sm:-mr-80 lg:-mr-96 absolute inset-y-0 right-1/2 w-[200%] origin-top-right skew-x-[-30deg] bg-(--bg-white-0) shadow-orange-600/10 shadow-xl ring-1 ring-orange-50"
				/>

				<div className="relative">
					<div className="mx-auto max-w-2xl lg:mx-0 lg:shrink-0 lg:pt-8">
						<h1
							className="text-pretty font-semibold text-h2 tracking-tighter lg:text-h1"
							data-aos="fade-up"
							data-aos-duration="1000"
						>
							Your All-in-One Screenshot Solution
						</h1>

						<p
							data-aos="fade-up"
							data-aos-duration="1500"
							className="mt-4 text-pretty text-(--text-sub-600) lg:text-paragraph-lg"
						>
							Whether you need to <strong>capture</strong>,{" "}
							<strong>store</strong>, or <strong>integrate screenshots</strong>,
							ScreenshoThis offers the tools you need with a simple API.
						</p>

						<div
							data-aos="fade-up"
							data-aos-duration="2000"
							className="mt-12 flex items-center gap-2"
						>
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
