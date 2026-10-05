import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { OnboardingScreen } from "./OnboardingScreen";

describe("OnboardingScreen", () => {
	it("renders nothing when isOpen is false", () => {
		const html = renderToStaticMarkup(<OnboardingScreen isOpen={false} onClose={vi.fn()} />);
		expect(html).toBe("");
	});

	it("renders when isOpen is true and includes title and step indicators", () => {
		const html = renderToStaticMarkup(<OnboardingScreen isOpen={true} onClose={vi.fn()} />);
		expect(html).toContain("MotionCap Studio");
		expect(html).toContain("Liquid Glass Floating HUD");
		expect(html).toContain("Step 1 of 4");
		expect(html).toContain("Skip Tour");
		expect(html).toContain("Continue");
	});
});
