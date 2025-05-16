import ArrowRight01Icon from "virtual:icons/hugeicons/arrow-right-01";

import { Link, createFileRoute, redirect } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { z } from "zod";

import { getCheckoutServerFn } from "#/actions/get-checkout.ts";
import { Aos } from "#/components/aos.tsx";
import { Confetti } from "#/components/cofetti.tsx";
import { Button } from "#/components/ui/button.tsx";

export const Route = createFileRoute("/_marketing/confirmation")({
	validateSearch: zodValidator(
		z.object({
			checkout_id: z.string({
				required_error: "Checkout ID is required",
			}),
		}),
	),
	beforeLoad: async ({ search }) => {
		if (!search.checkout_id) {
			throw redirect({
				to: "/",
			});
		}

		const checkout = await getCheckoutServerFn({
			data: {
				checkoutId: search.checkout_id,
			},
		});

		if (!checkout) {
			throw redirect({
				to: "/",
			});
		}

		return { checkout };
	},
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<>
			<Aos />
			<Confetti id="confirmation" />
			<section>
				<div className="container relative grid min-h-dvh max-w-6xl items-center overflow-hidden border-x bg-(--bg-white-0) p-4 py-32 lg:px-8 lg:pb-80">
					<div
						aria-hidden="true"
						className="-mr-96 sm:-mr-80 lg:-mr-96 absolute inset-y-0 right-1/2 w-[200%] origin-top-right skew-x-[-30deg] bg-(--bg-white-0) shadow-orange-600/10 shadow-xl ring-1 ring-orange-50"
					/>

					<div className="mx-auto text-center">
						<h1
							data-aos="fade-up"
							data-aos-duration="1000"
							className="font-bold text-h2 tracking-tight lg:text-h1"
						>
							Thank you for your purchase!
						</h1>

						<p
							data-aos="fade-up"
							data-aos-duration="1500"
							className="mt-4 text-(--text-sub-600) text-paragraph-lg"
						>
							Your purchase has been confirmed.
						</p>

						<div
							data-aos="fade-up"
							data-aos-duration="2000"
							className="mx-auto mt-12 flex max-w-xs flex-col items-center justify-center gap-2"
						>
							<Button
								asChild
								$type="neutral"
								trailingIcon={ArrowRight01Icon}
								trailingIconClassName="easy-out-in size-4 duration-300 group-hover:translate-x-1"
							>
								<Link to="/playground">Check out the Playground</Link>
							</Button>
							<Button
								asChild
								$style="stroke"
								trailingIcon={ArrowRight01Icon}
								trailingIconClassName="easy-out-in size-4 duration-300 group-hover:translate-x-1"
							>
								<Link to="/dashboard">Go to Dashboard</Link>
							</Button>
						</div>
					</div>
				</div>
			</section>
		</>
	);
}
