import { describe, expect, it } from "vitest";
import type { CursorTelemetryPoint } from "../types";
import {
	findActiveKeystrokeSample,
	formatKeycapLabel,
	parseShortcutTokens,
} from "./keystrokeVisualizer";

describe("keystrokeVisualizer", () => {
	it("parses shortcut tokens cleanly", () => {
		expect(parseShortcutTokens("Ctrl + Shift + P")).toEqual(["Ctrl", "Shift", "P"]);
		expect(parseShortcutTokens("Cmd+K")).toEqual(["Cmd", "K"]);
		expect(parseShortcutTokens("Alt + Tab")).toEqual(["Alt", "Tab"]);
		expect(parseShortcutTokens("Esc")).toEqual(["Esc"]);
		expect(parseShortcutTokens("")).toEqual([]);
	});

	it("formats keycap labels properly", () => {
		expect(formatKeycapLabel("Meta")).toBe("⌘");
		expect(formatKeycapLabel("cmd")).toBe("⌘");
		expect(formatKeycapLabel("Ctrl")).toBe("Ctrl");
		expect(formatKeycapLabel("Shift")).toBe("Shift");
		expect(formatKeycapLabel("Backspace")).toBe("⌫");
		expect(formatKeycapLabel("Enter")).toBe("↵");
		expect(formatKeycapLabel("P")).toBe("P");
	});

	it("finds active keystroke sample within window and returns null after expiry", () => {
		const samples: CursorTelemetryPoint[] = [
			{ timeMs: 100, cx: 0.1, cy: 0.1, interactionType: "move" },
			{
				timeMs: 500,
				cx: 0.2,
				cy: 0.2,
				interactionType: "keystroke",
				keystroke: "Ctrl + Shift + P",
			},
			{ timeMs: 600, cx: 0.3, cy: 0.3, interactionType: "move" },
			{ timeMs: 900, cx: 0.4, cy: 0.4, interactionType: "move" },
			{
				timeMs: 2500,
				cx: 0.5,
				cy: 0.5,
				interactionType: "keystroke",
				keystroke: "Alt + Tab",
			},
		];

		// Before any keystroke
		expect(findActiveKeystrokeSample(samples, 400)).toBeNull();

		// Right at keystroke (pop in)
		const at500 = findActiveKeystrokeSample(samples, 500);
		expect(at500).not.toBeNull();
		expect(at500?.keystroke).toBe("Ctrl + Shift + P");
		expect(at500?.elapsedMs).toBe(0);
		expect(at500?.progress).toBe(0);

		// During active window across intermediate mouse moves
		const at800 = findActiveKeystrokeSample(samples, 800);
		expect(at800).not.toBeNull();
		expect(at800?.keystroke).toBe("Ctrl + Shift + P");
		expect(at800?.elapsedMs).toBe(300);
		expect(at800?.opacity).toBe(1);

		// After maxAgeMs (default 1400ms, so 500 + 1400 = 1900ms)
		expect(findActiveKeystrokeSample(samples, 2000)).toBeNull();

		// At second keystroke
		const at2600 = findActiveKeystrokeSample(samples, 2600);
		expect(at2600).not.toBeNull();
		expect(at2600?.keystroke).toBe("Alt + Tab");
		expect(at2600?.elapsedMs).toBe(100);
	});

	it("returns null for empty or invalid samples", () => {
		expect(findActiveKeystrokeSample([], 1000)).toBeNull();
		expect(findActiveKeystrokeSample(undefined, 1000)).toBeNull();
	});
});
