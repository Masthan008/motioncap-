import { describe, expect, it } from "vitest";
import {
	AUTO_STOP_PRESETS,
	calculateAutoStopRemaining,
	clampAutoStopSeconds,
	formatAutoStopPresetLabel,
	formatRemainingCountdown,
	shouldAutoStop,
} from "./autoStopTimer";

describe("autoStopTimer", () => {
	describe("clampAutoStopSeconds", () => {
		it("clamps negative numbers and NaN to 0", () => {
			expect(clampAutoStopSeconds(-10)).toBe(0);
			expect(clampAutoStopSeconds(Number.NaN)).toBe(0);
		});

		it("preserves valid values and floors decimals", () => {
			expect(clampAutoStopSeconds(120.7)).toBe(120);
			expect(clampAutoStopSeconds(300)).toBe(300);
		});

		it("caps at max 6 hours (21600 seconds)", () => {
			expect(clampAutoStopSeconds(30000)).toBe(21600);
		});
	});

	describe("formatAutoStopPresetLabel", () => {
		it("formats 0 as Off", () => {
			expect(formatAutoStopPresetLabel(0)).toBe("Off");
			expect(formatAutoStopPresetLabel(-5)).toBe("Off");
		});

		it("formats seconds under a minute", () => {
			expect(formatAutoStopPresetLabel(45)).toBe("45s");
		});

		it("formats exact minutes", () => {
			expect(formatAutoStopPresetLabel(60)).toBe("1m");
			expect(formatAutoStopPresetLabel(300)).toBe("5m");
			expect(formatAutoStopPresetLabel(3600)).toBe("60m");
		});

		it("formats minutes with remaining seconds", () => {
			expect(formatAutoStopPresetLabel(95)).toBe("1m 35s");
		});
	});

	describe("calculateAutoStopRemaining", () => {
		it("returns null when limit is not set or 0", () => {
			expect(calculateAutoStopRemaining(10, null)).toBeNull();
			expect(calculateAutoStopRemaining(10, undefined)).toBeNull();
			expect(calculateAutoStopRemaining(10, 0)).toBeNull();
		});

		it("calculates remaining seconds correctly", () => {
			expect(calculateAutoStopRemaining(0, 300)).toBe(300);
			expect(calculateAutoStopRemaining(150, 300)).toBe(150);
			expect(calculateAutoStopRemaining(299, 300)).toBe(1);
		});

		it("clamps remaining seconds to 0 when elapsed exceeds limit", () => {
			expect(calculateAutoStopRemaining(300, 300)).toBe(0);
			expect(calculateAutoStopRemaining(350, 300)).toBe(0);
		});
	});

	describe("formatRemainingCountdown", () => {
		it("formats MM:SS for durations under an hour", () => {
			expect(formatRemainingCountdown(0)).toBe("00:00");
			expect(formatRemainingCountdown(9)).toBe("00:09");
			expect(formatRemainingCountdown(65)).toBe("01:05");
			expect(formatRemainingCountdown(600)).toBe("10:00");
			expect(formatRemainingCountdown(3599)).toBe("59:59");
		});

		it("formats HH:MM:SS for durations >= 1 hour", () => {
			expect(formatRemainingCountdown(3600)).toBe("01:00:00");
			expect(formatRemainingCountdown(3665)).toBe("01:01:05");
			expect(formatRemainingCountdown(7325)).toBe("02:02:05");
		});

		it("handles negative values by clamping to 00:00", () => {
			expect(formatRemainingCountdown(-15)).toBe("00:00");
		});
	});

	describe("shouldAutoStop", () => {
		it("returns false if limit is disabled", () => {
			expect(shouldAutoStop(100, null)).toBe(false);
			expect(shouldAutoStop(100, undefined)).toBe(false);
			expect(shouldAutoStop(100, 0)).toBe(false);
		});

		it("returns false if elapsed is less than limit", () => {
			expect(shouldAutoStop(59, 60)).toBe(false);
			expect(shouldAutoStop(299, 300)).toBe(false);
		});

		it("returns true when elapsed reaches or exceeds limit", () => {
			expect(shouldAutoStop(60, 60)).toBe(true);
			expect(shouldAutoStop(301, 300)).toBe(true);
		});
	});

	describe("AUTO_STOP_PRESETS", () => {
		it("contains Off and standard recording duration presets", () => {
			expect(AUTO_STOP_PRESETS.length).toBeGreaterThanOrEqual(6);
			expect(AUTO_STOP_PRESETS[0].seconds).toBe(0);
			expect(AUTO_STOP_PRESETS.some((p) => p.seconds === 300)).toBe(true); // 5m
			expect(AUTO_STOP_PRESETS.some((p) => p.seconds === 600)).toBe(true); // 10m
		});
	});
});
