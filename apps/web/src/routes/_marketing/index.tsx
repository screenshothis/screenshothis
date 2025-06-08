
import * as React from "react";

import { CodeSection } from "#/components/sections/code-section.tsx";
import { FeaturesSection } from "#/components/sections/features-section.tsx";
import { GetStartedSection } from "#/components/sections/get-started-section.tsx";
import { HeroSection } from "#/components/sections/hero-section.tsx";
import { ImageShowcaseSection } from "#/components/sections/image-showcase-section.tsx";
import { PricingSection } from "#/components/sections/pricing-section.tsx";
import { authClient } from "#/lib/auth.ts";

export const Route = createFileRoute({
	component: RouteComponent,
});

function RouteComponent() {
	React.useEffect(() => {
		void authClient.oneTap();
	}, []);

	return (
		<>
			<HeroSection />
			<CodeSection />
			<FeaturesSection />
			<ImageShowcaseSection />
			<GetStartedSection />
			<PricingSection />
		</>
	);
}
