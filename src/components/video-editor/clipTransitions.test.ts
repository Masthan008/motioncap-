import { describe, expect, it } from "vitest";
import {
	computeTransitionVisualState,
	getActiveClipTransition,
	getClipTransitionLabel,
	getClipTransitionShortLabel,
	normalizeClipTransition,
} from "./clipTransitions";
import type { ClipRegion } from "./types";

describe("clipTransitions", () => {
	describe("normalizeClipTransition", () => {
		it("returns undefined for null, non-objects, or 'none' type", () => {
			expect(normalizeClipTransition(null)).toBeUndefined();
			expect(normalizeClipTransition(undefined)).toBeUndefined();
			expect(normalizeClipTransition({ type: "none" })).toBeUndefined();
			expect(normalizeClipTransition({ type: "unknown-type" })).toBeUndefined();
		});

		it("normalizes valid transition with default duration if missing", () => {
			const result = normalizeClipTransition({ type: "dip-black" });
			expect(result).toEqual({
				type: "dip-black",
				durationMs: 500,
			});
		});

		it("clamps duration within [100, 1500] range", () => {
			expect(normalizeClipTransition({ type: "slide-left", durationMs: 50 })).toEqual({
				type: "slide-left",
				durationMs: 100,
			});
			expect(normalizeClipTransition({ type: "slide-left", durationMs: 2500 })).toEqual({
				type: "slide-left",
				durationMs: 1500,
			});
			expect(normalizeClipTransition({ type: "zoom-in", durationMs: 400 })).toEqual({
				type: "zoom-in",
				durationMs: 400,
			});
		});
	});

	describe("labels", () => {
		it("provides human-readable labels", () => {
			expect(getClipTransitionLabel("dip-black")).toBe("Dip to Black");
			expect(getClipTransitionLabel("crossfade")).toBe("Crossfade");
			expect(getClipTransitionLabel("zoom-in")).toBe("Zoom Punch");
			expect(getClipTransitionShortLabel("dip-black")).toBe("Dip Black");
			expect(getClipTransitionShortLabel("slide-left")).toBe("Slide L");
		});
	});

	describe("computeTransitionVisualState", () => {
		it("calculates dip-black with bell-curve opacity peaking at 0.5", () => {
			const start = computeTransitionVisualState("dip-black", 0);
			expect(start.dipColor).toBe("black");
			expect(start.dipOpacity).toBeCloseTo(0, 5);

			const peak = computeTransitionVisualState("dip-black", 0.5);
			expect(peak.dipColor).toBe("black");
			expect(peak.dipOpacity).toBeCloseTo(1, 5);

			const end = computeTransitionVisualState("dip-black", 1);
			expect(end.dipOpacity).toBeCloseTo(0, 5);
		});

		it("calculates dip-white with bell-curve opacity peaking at 0.5", () => {
			const peak = computeTransitionVisualState("dip-white", 0.5);
			expect(peak.dipColor).toBe("white");
			expect(peak.dipOpacity).toBeCloseTo(1, 5);
		});

		it("calculates zoom-in punch scaling up and back down", () => {
			const start = computeTransitionVisualState("zoom-in", 0);
			expect(start.transform.scale).toBeCloseTo(1.0, 5);

			const peak = computeTransitionVisualState("zoom-in", 0.5);
			expect(peak.transform.scale).toBeGreaterThan(1.2);

			const end = computeTransitionVisualState("zoom-in", 1.0);
			expect(end.transform.scale).toBeCloseTo(1.0, 5);
		});

		it("calculates slide-left translation", () => {
			const outgoing = computeTransitionVisualState("slide-left", 0.25);
			expect(outgoing.transform.translateXPercent).toBeCloseTo(-25, 1);

			const incoming = computeTransitionVisualState("slide-left", 0.75);
			expect(incoming.transform.translateXPercent).toBeCloseTo(25, 1);
		});
	});

	describe("getActiveClipTransition", () => {
		const clips: ClipRegion[] = [
			{
				id: "clip-1",
				startMs: 0,
				endMs: 4000,
				speed: 1,
			},
			{
				id: "clip-2",
				startMs: 4000,
				endMs: 8000,
				speed: 1,
				transition: {
					type: "dip-black",
					durationMs: 600,
				},
			},
		];

		it("returns null when outside the transition window", () => {
			// Window is 4000 - 300 to 4000 + 300 = [3700, 4300]
			expect(getActiveClipTransition(2000, clips)).toBeNull();
			expect(getActiveClipTransition(3600, clips)).toBeNull();
			expect(getActiveClipTransition(4400, clips)).toBeNull();
		});

		it("returns active transition when within window", () => {
			const active = getActiveClipTransition(4000, clips);
			expect(active).not.toBeNull();
			expect(active?.type).toBe("dip-black");
			expect(active?.seamMs).toBe(4000);
			expect(active?.windowStartMs).toBe(3700);
			expect(active?.windowEndMs).toBe(4300);
			expect(active?.durationMs).toBe(600);
			expect(active?.progress).toBeCloseTo(0.5, 3);
			expect(active?.dipColor).toBe("black");
			expect(active?.dipOpacity).toBeCloseTo(1, 3);
			expect(active?.isOutgoing).toBe(false);
		});

		it("detects outgoing phase before seam", () => {
			const active = getActiveClipTransition(3850, clips);
			expect(active).not.toBeNull();
			expect(active?.progress).toBeCloseTo(0.25, 3);
			expect(active?.isOutgoing).toBe(true);
		});

		it("clamps window if clips are shorter than transition duration", () => {
			const shortClips: ClipRegion[] = [
				{ id: "c1", startMs: 0, endMs: 200, speed: 1 },
				{
					id: "c2",
					startMs: 200,
					endMs: 500,
					speed: 1,
					transition: { type: "slide-left", durationMs: 1000 },
				},
			];
			// c1 is 200ms long, halfDuration cannot exceed 100ms
			const active = getActiveClipTransition(200, shortClips);
			expect(active).not.toBeNull();
			expect(active?.windowStartMs).toBe(100);
			expect(active?.windowEndMs).toBe(300);
			expect(active?.durationMs).toBe(200);
		});

		it("handles intro transition on the first clip", () => {
			const introClips: ClipRegion[] = [
				{
					id: "c1",
					startMs: 0,
					endMs: 5000,
					speed: 1,
					transition: { type: "dip-white", durationMs: 400 },
				},
			];

			const active = getActiveClipTransition(200, introClips);
			expect(active).not.toBeNull();
			expect(active?.type).toBe("dip-white");
			expect(active?.progress).toBeCloseTo(0.5, 3);
			expect(active?.windowStartMs).toBe(0);
			expect(active?.windowEndMs).toBe(400);

			expect(getActiveClipTransition(600, introClips)).toBeNull();
		});

		it("ignores transitions across non-contiguous clips (gaps)", () => {
			const gappedClips: ClipRegion[] = [
				{ id: "c1", startMs: 0, endMs: 3000, speed: 1 },
				{
					id: "c2",
					startMs: 5000, // gap of 2000ms
					endMs: 8000,
					speed: 1,
					transition: { type: "dip-black", durationMs: 500 },
				},
			];

			expect(getActiveClipTransition(5000, gappedClips)).toBeNull();
		});
	});
});
