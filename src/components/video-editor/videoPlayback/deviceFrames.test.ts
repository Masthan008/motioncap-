import { describe, expect, it } from "vitest";
import {
	DEFAULT_DEVICE_FRAME_STYLE,
	DEVICE_FRAMES,
	getDeviceFrameInsets,
	normalizeDeviceFrameStyle,
} from "./deviceFrames";

describe("deviceFrames", () => {
	it("normalizes device frame style properly", () => {
		expect(normalizeDeviceFrameStyle("macos-dark")).toBe("macos-dark");
		expect(normalizeDeviceFrameStyle("macos-light")).toBe("macos-light");
		expect(normalizeDeviceFrameStyle("browser-dark")).toBe("browser-dark");
		expect(normalizeDeviceFrameStyle("browser-light")).toBe("browser-light");
		expect(normalizeDeviceFrameStyle("none")).toBe("none");
		expect(normalizeDeviceFrameStyle("invalid")).toBe(DEFAULT_DEVICE_FRAME_STYLE);
		expect(normalizeDeviceFrameStyle(null)).toBe(DEFAULT_DEVICE_FRAME_STYLE);
	});

	it("returns correct insets for each frame style", () => {
		expect(getDeviceFrameInsets("none")).toBeNull();
		const macosInsets = getDeviceFrameInsets("macos-dark");
		expect(macosInsets).not.toBeNull();
		expect(macosInsets?.top).toBeGreaterThan(0);
		expect(macosInsets?.bottom).toBe(0);

		const browserInsets = getDeviceFrameInsets("browser-dark");
		expect(browserInsets).not.toBeNull();
		expect(browserInsets?.top).toBeGreaterThan(macosInsets!.top);
	});

	it("has complete configuration for all defined frame styles", () => {
		for (const key of Object.keys(DEVICE_FRAMES) as Array<keyof typeof DEVICE_FRAMES>) {
			const config = DEVICE_FRAMES[key];
			expect(config.id).toBe(key);
			expect(config.label.length).toBeGreaterThan(0);
			if (key !== "none") {
				expect(config.insets).not.toBeNull();
				expect(config.hasTrafficLights).toBe(true);
			}
		}
	});

	it("uses MotionCap branding for default frame title and url", () => {
		expect(DEVICE_FRAMES["macos-dark"].defaultTitle).toBe("MotionCap Window");
		expect(DEVICE_FRAMES["macos-light"].defaultTitle).toBe("MotionCap Window");
		expect(DEVICE_FRAMES["browser-dark"].defaultUrl).toBe("motioncap.app");
		expect(DEVICE_FRAMES["browser-light"].defaultUrl).toBe("motioncap.app");
	});
});
