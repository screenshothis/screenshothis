import Sidebar from "#/components/sidebar.tsx";
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app")({
	beforeLoad({ context, location }) {
		if (!context.userId) {
			throw redirect({
				to: "/login/$",
				search: {
					redirect_url: location.href,
				},
			});
		}
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
