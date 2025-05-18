import { createFileRoute } from "@tanstack/react-router";

import { CodeSection } from "#/components/sections/code-section.tsx";
import { FeaturesSection } from "#/components/sections/features-section.tsx";
import { HeroSection } from "#/components/sections/hero-section.tsx";
import { ImageShowcaseSection } from "#/components/sections/image-showcase-section.tsx";
import { PricingSection } from "#/components/sections/pricing-section.tsx";

export const Route = createFileRoute("/_marketing/")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<>
			<HeroSection />
			<CodeSection />
			<FeaturesSection />
			<ImageShowcaseSection />
			<PricingSection />
		</>
	);
}
