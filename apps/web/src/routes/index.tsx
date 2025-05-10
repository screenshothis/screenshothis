import { createFileRoute } from "@tanstack/react-router";

import { CodeSection } from "#/components/sections/code-section.tsx";
import { HeroSection } from "#/components/sections/hero-section.tsx";

export const Route = createFileRoute("/")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<>
			<HeroSection />
			<CodeSection />
		</>
	);
}
