import { createFileRoute } from "@tanstack/react-router";

import { Aos } from "#/components/aos.tsx";
import { CodeSection } from "#/components/sections/code-section.tsx";
import { HeroSection } from "#/components/sections/hero-section.tsx";
import { ImageShowcaseSection } from "#/components/sections/image-showcase-section.tsx";
import { PricingSection } from "#/components/sections/pricing-section.tsx";

export const Route = createFileRoute("/_marketing/")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<>
			<Aos />
			<HeroSection />
			<CodeSection />
			<ImageShowcaseSection />
			<PricingSection />
		</>
	);
}
