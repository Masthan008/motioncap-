import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SplashScreen } from "./SplashScreen";

describe("SplashScreen", () => {
	it("renders brand title and studio edition badge in static markup", () => {
		const html = renderToStaticMarkup(<SplashScreen minimumDurationMs={5000} />);
		expect(html).toContain("MotionCap");
		expect(html).toContain("STUDIO EDITION");
		expect(html).toContain("Initializing Studio Engine...");
	});
});
