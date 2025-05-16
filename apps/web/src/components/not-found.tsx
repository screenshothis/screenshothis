import ArrowLeft01Icon from "virtual:icons/hugeicons/arrow-left-01";
import ArrowRight01Icon from "virtual:icons/hugeicons/arrow-right-01";

import { Link } from "@tanstack/react-router";

import { Aos } from "./aos.tsx";
import { Footer } from "./footer.tsx";
import { Header } from "./header.tsx";
import { Button } from "./ui/button.tsx";

export function NotFound() {
	return (
		<>
			<Aos />

			<div className="grid min-h-screen">
				<div className="mx-auto w-full max-w-7xl border-(--stroke-soft-200) border-x bg-[repeating-linear-gradient(125deg,transparent,transparent_6px,var(--stroke-soft-200)_6px,var(--stroke-soft-200)_7px)] px-2 md:px-0 lg:overflow-hidden">
					<Header />

					<main className="grow">
						<section className="relative">
							<div className="container flex min-h-dvh flex-col items-center justify-center border-x bg-(--bg-white-0) py-32 lg:px-12">
								<div className="mx-auto text-center">
									<h1
										data-aos="fade-up"
										data-aos-duration="1000"
										className="font-bold text-h2 tracking-tight lg:text-h1"
									>
										404: Page Not Found
									</h1>

									<p
										data-aos="fade-up"
										data-aos-duration="1500"
										className="mt-4 text-pretty text-(--text-sub-600) lg:text-paragraph-lg"
									>
										Sorry, the page you are looking for could not be found.
									</p>

									<div
										data-aos="fade-up"
										data-aos-duration="2000"
										className="mx-auto mt-12 grid max-w-xs gap-2"
									>
										<Button
											asChild
											leadingIcon={ArrowLeft01Icon}
											leadingIconClassName="easy-out-in size-4 duration-300 group-hover:-translate-x-1"
										>
											<Link to="/">Go to Home</Link>
										</Button>
										<Button
											asChild
											$style="stroke"
											trailingIcon={ArrowRight01Icon}
											trailingIconClassName="easy-out-in size-4 duration-300 group-hover:translate-x-1"
										>
											<Link to="/register">Register</Link>
										</Button>
									</div>
								</div>
							</div>
						</section>
					</main>

					<Footer />
				</div>
			</div>
		</>
	);
}
