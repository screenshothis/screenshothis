import { Outlet } from "@tanstack/react-router";

import { Footer } from "#/components/footer.tsx";
import { Header } from "#/components/header.tsx";

export const Route = createFileRoute({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="grid min-h-screen">
			<div className="mx-auto w-full max-w-7xl border-(--stroke-soft-200) border-x bg-[repeating-linear-gradient(125deg,transparent,transparent_6px,var(--stroke-soft-200)_6px,var(--stroke-soft-200)_7px)] px-2 md:px-0 lg:overflow-hidden">
				<Header />

				<main className="grow">
					<Outlet />
				</main>

				<Footer />
			</div>
		</div>
	);
}
