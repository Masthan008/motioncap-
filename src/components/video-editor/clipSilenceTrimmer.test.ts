import { describe, expect, it } from "vitest";
import { normalizeSilenceIntervals, planSilenceCuts } from "./clipSilenceTrimmer";
import type { ClipRegion } from "./types";

function createIdFactory() {
	let count = 1;
	return () => `clip-${count++}`;
}

describe("clipSilenceTrimmer", () => {
	describe("normalizeSilenceIntervals", () => {
		it("returns empty array for empty inputs", () => {
			expect(normalizeSilenceIntervals([], 10000)).toEqual([]);
		});

		it("applies edge padding to prevent clipping speech", () => {
			const raw = [{ startMs: 1000, endMs: 3000 }];
			const normalized = normalizeSilenceIntervals(raw, 10000, 100);
			// 1000 + 100 = 1100, 3000 - 100 = 2900
			expect(normalized).toEqual([{ startMs: 1100, endMs: 2900 }]);
		});

		it("merges overlapping and adjacent intervals", () => {
			const raw = [
				{ startMs: 1000, endMs: 3000 },
				{ startMs: 2800, endMs: 5000 },
			];
			const normalized = normalizeSilenceIntervals(raw, 10000, 50);
			expect(normalized.length).toBe(1);
			expect(normalized[0].startMs).toBe(1050);
			expect(normalized[0].endMs).toBe(4950);
		});

		it("clamps infinite endMs to sourceDurationMs", () => {
			const raw = [{ startMs: 8000, endMs: Number.POSITIVE_INFINITY }];
			const normalized = normalizeSilenceIntervals(raw, 10000, 100);
			expect(normalized).toEqual([{ startMs: 8100, endMs: 9900 }]);
		});
	});

	describe("planSilenceCuts", () => {
		it("returns unchanged when no silences provided", () => {
			const clips: ClipRegion[] = [{ id: "c1", startMs: 0, endMs: 10000, speed: 1 }];
			const result = planSilenceCuts({
				clipRegions: clips,
				silences: [],
				sourceDurationMs: 10000,
				createId: createIdFactory(),
			});
			expect(result.changed).toBe(false);
			expect(result.clips).toEqual(clips);
		});

		it("cuts out a silence in the middle of a single clip", () => {
			const clips: ClipRegion[] = [{ id: "c1", startMs: 0, endMs: 10000, speed: 1 }];
			const silences = [{ startMs: 3000, endMs: 6000 }]; // 3s of silence
			const result = planSilenceCuts({
				clipRegions: clips,
				silences,
				sourceDurationMs: 10000,
				createId: createIdFactory(),
				options: { edgePadMs: 100 }, // silence cut from 3100 to 5900 (2800ms)
			});

			expect(result.changed).toBe(true);
			expect(result.clips.length).toBe(2);
			// Clip 1: 0 to 3100 (3100ms)
			expect(result.clips[0].sourceStartMs).toBe(0);
			expect(result.clips[0].startMs).toBe(0);
			expect(result.clips[0].endMs).toBe(3100);

			// Clip 2: 5900 to 10000 (4100ms), packed immediately after Clip 1
			expect(result.clips[1].sourceStartMs).toBe(5900);
			expect(result.clips[1].startMs).toBe(3100);
			expect(result.clips[1].endMs).toBe(7200);

			expect(result.savedMs).toBe(2800);
		});

		it("preserves speed on split sub-clips", () => {
			const clips: ClipRegion[] = [{ id: "c1", startMs: 0, endMs: 5000, speed: 2 }]; // 10s of source at 2x
			const silences = [{ startMs: 4000, endMs: 7000 }];
			const result = planSilenceCuts({
				clipRegions: clips,
				silences,
				sourceDurationMs: 10000,
				createId: createIdFactory(),
				options: { edgePadMs: 0 },
			});

			expect(result.changed).toBe(true);
			expect(result.clips.length).toBe(2);
			expect(result.clips[0].speed).toBe(2);
			expect(result.clips[1].speed).toBe(2);
			// Clip 1: 0 to 4000 source ms -> 2000 timeline ms
			expect(result.clips[0].startMs).toBe(0);
			expect(result.clips[0].endMs).toBe(2000);
			// Clip 2: 7000 to 10000 source ms -> 1500 timeline ms
			expect(result.clips[1].startMs).toBe(2000);
			expect(result.clips[1].endMs).toBe(3500);
		});
	});
});
