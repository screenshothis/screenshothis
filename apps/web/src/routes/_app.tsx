import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import Sidebar from "#/components/sidebar.tsx";

export const Route = createFileRoute("/_app")({
	async beforeLoad({ context: { queryClient, orpc, ...context }, location }) {
		if (!context.session?.id) {
			throw redirect({
				to: "/login/$",
				search: {
					redirect_url: location.href,
				},
			});
		}

		await queryClient.ensureQueryData(orpc.users.me.queryOptions());
	},
	component: PathlessLayoutComponent,
});

function PathlessLayoutComponent() {
	return (
		<>
			<div className="flex min-h-screen flex-col items-start lg:grid lg:grid-cols-[auto_minmax(0,1fr)]">
				<Sidebar />
				{/*
            <HeaderMobile /> */}
				<div className="relative z-50 mx-auto flex w-full max-w-[1360px] flex-1 flex-col self-stretch">
					<Outlet />
				</div>
			</div>

			{/* <DynamicSettingsModal /> */}
		</>
	);
}
