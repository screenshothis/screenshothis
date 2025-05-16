import ArrowRight01Icon from "virtual:icons/hugeicons/arrow-right-01";

import { Link, createFileRoute, redirect } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { z } from "zod";

import { getCheckoutServerFn } from "#/actions/get-checkout.ts";
import { Aos } from "#/components/aos.tsx";
import { Confetti } from "#/components/confetti.tsx";
import { Button } from "#/components/ui/button.tsx";
import { currencyFormatter } from "#/utils/currency.ts";

export const Route = createFileRoute("/_marketing/confirmation")({
	validateSearch: zodValidator(
		z.object({
			checkout_id: z
				.string({
					required_error: "Checkout ID is required",
				})
				.uuid({
					message: "Invalid checkout ID",
				}),
		}),
	),

	loaderDeps({ search }) {
		return {
			checkoutId: search.checkout_id,
		};
	},
	loader: async ({ deps: { checkoutId } }) => {
		try {
			const checkout = await getCheckoutServerFn({
				data: {
					checkoutId,
				},
			});

			if (!checkout) {
				throw redirect({
					to: "/",
				});
			}

			return { checkout };
		} catch (error) {
			if (error instanceof Response && error.status === 404) {
				console.error("Checkout not found:", checkoutId);
			} else if (error instanceof Response && error.status === 401) {
				console.error("Authentication failed when fetching checkout");
			} else if (error instanceof Response && error.status === 429) {
				console.error("Rate limited when fetching checkout");
			} else if (error instanceof Error) {
				console.error("Failed to fetch checkout:", error.message);
			} else {
				console.error("Unknown error fetching checkout:", error);
			}

			throw redirect({
				to: "/",
			});
		}
	},
	component: RouteComponent,
});

function RouteComponent() {
	const { checkout } = Route.useLoaderData();

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

						{checkout && (
							<div
								data-aos="fade-up"
								data-aos-duration="1800"
								className="mt-4 text-(--text-sub-600) text-paragraph-md"
							>
								<p>Order ID: {checkout.id}</p>
								{checkout.totalAmount && (
									<p>
										<span>Total Amount: </span>
										<span>
											{currencyFormatter({
												amount: checkout.totalAmount,
											})}
										</span>
									</p>
								)}
							</div>
						)}

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
								<Link
									to="/playground"
									aria-label="Go to interactive playground environment"
								>
									Check out the Playground
								</Link>
							</Button>
							<Button
								asChild
								$style="stroke"
								trailingIcon={ArrowRight01Icon}
								trailingIconClassName="easy-out-in size-4 duration-300 group-hover:translate-x-1"
							>
								<a
									href={`${import.meta.env.VITE_SERVER_URL}/auth/portal`}
									aria-label="Navigate to your customer portal"
									target="_blank"
									rel="noopener noreferrer"
								>
									Go to Customer Portal
								</a>
							</Button>
						</div>
					</div>
				</div>
			</section>
		</>
	);
}
