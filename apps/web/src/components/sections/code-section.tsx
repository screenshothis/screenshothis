import { CodeBlock } from "../code-block.tsx";

export function CodeSection() {
	return (
		<section id="code">
			<div className="container max-w-6xl border-x p-4 pt-24 2xl:max-w-[1400px]">
				<div className="-mt-40 lg:-mt-80 z-40 grid grid-cols-1 items-start gap-12 lg:grid-cols-2 lg:gap-24">
					<CodeBlock
						wrapperProps={{
							"data-aos": "fade-up",
							"data-aos-duration": "2000",
						}}
						lang="bash"
						children={[
							"https://api.screenshothis.com/v1/screenshots/take",
							"   ?api_key=<your-api-key>",
							"   &url=https://tanstack.com",
							"   &width=1800",
							"   &height=945",
							"   &block_ads=true",
							"   &block_cookie_banners=true",
							"   &block_trackers=true",
						].join("\n")}
					/>

					<img
						data-aos="fade-up"
						data-aos-duration="2500"
						src="/img/tanstack.jpeg"
						alt="Showcase showing Tanstack.com"
						className="rounded-12 bg-(--bg-white-0) shadow-2xl outline outline-(--stroke-soft-200)"
					/>
				</div>
			</div>
		</section>
	);
}
