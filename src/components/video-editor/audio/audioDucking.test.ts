import { describe, expect, it } from "vitest";
import {
	bridgeSpeechIntervals,
	buildDuckingGainEnvelope,
	computeDuckingGainAtTime,
	DEFAULT_DUCKING_AMOUNT,
	detectSpeechIntervalsFromPeaks,
	mergeSpeechIntervals,
} from "./audioDucking";

describe("audioDucking", () => {
	describe("detectSpeechIntervalsFromPeaks", () => {
		it("returns empty array for empty or silent peaks", () => {
			expect(detectSpeechIntervalsFromPeaks(new Float32Array([]), 1000)).toEqual([]);
			expect(detectSpeechIntervalsFromPeaks(new Float32Array([0, 0, 0, 0]), 1000)).toEqual([]);
		});

		it("detects speech when peaks exceed threshold", () => {
			// 10 peaks across 1000ms (100ms per peak)
			// peaks 3, 4, 5 (300ms to 600ms) are above 0.1 threshold
			const peaks = new Float32Array([0, 0, 0, 0.5, 0.6, 0.4, 0, 0, 0, 0]);
			const intervals = detectSpeechIntervalsFromPeaks(peaks, 1000, 0.1, 100, 0);

			expect(intervals.length).toBe(1);
			expect(intervals[0].startMs).toBe(300);
			expect(intervals[0].endMs).toBe(600);
		});

		it("bridges short pauses between words", () => {
			// Speech from 0-300ms, pause from 300-500ms (200ms pause), speech from 500-800ms
			const peaks = new Float32Array([
				0.5, 0.5, 0.5, // 0 - 300ms
				0.01, 0.01, // 300 - 500ms (pause)
				0.5, 0.5, 0.5, // 500 - 800ms
				0, 0, // 800 - 1000ms
			]);
			// With bridgePauseMs = 250ms, the 200ms pause should be bridged!
			const intervals = detectSpeechIntervalsFromPeaks(peaks, 1000, 0.1, 100, 250);
			expect(intervals.length).toBe(1);
			expect(intervals[0].startMs).toBe(0);
			expect(intervals[0].endMs).toBe(800);
		});

		it("does not bridge long pauses exceeding bridgePauseMs", () => {
			const peaks = new Float32Array([
				0.5, 0.5, 0.5, // 0 - 300ms
				0.01, 0.01, 0.01, 0.01, // 300 - 700ms (400ms pause)
				0.5, 0.5, 0.5, // 700 - 1000ms
			]);
			const intervals = detectSpeechIntervalsFromPeaks(peaks, 1000, 0.1, 100, 200);
			expect(intervals.length).toBe(2);
			expect(intervals[0].startMs).toBe(0);
			expect(intervals[0].endMs).toBe(300);
			expect(intervals[1].startMs).toBe(700);
			expect(intervals[1].endMs).toBe(1000);
		});
	});

	describe("mergeSpeechIntervals", () => {
		it("merges multiple groups of intervals", () => {
			const groupA = [{ startMs: 100, endMs: 400 }];
			const groupB = [{ startMs: 1000, endMs: 1500 }];
			const merged = mergeSpeechIntervals(groupA, groupB);
			expect(merged.length).toBe(2);
			expect(merged[0]).toEqual({ startMs: 100, endMs: 400 });
			expect(merged[1]).toEqual({ startMs: 1000, endMs: 1500 });
		});

		it("fuses overlapping intervals", () => {
			const groupA = [{ startMs: 100, endMs: 500 }];
			const groupB = [{ startMs: 400, endMs: 800 }];
			const merged = mergeSpeechIntervals(groupA, groupB);
			expect(merged.length).toBe(1);
			expect(merged[0]).toEqual({ startMs: 100, endMs: 800 });
		});
	});

	describe("computeDuckingGainAtTime", () => {
		const intervals = [{ startMs: 1000, endMs: 2000 }];
		const duckingAmount = 0.25;
		const attackMs = 100;
		const releaseMs = 400;

		it("returns 1.0 when far away from speech", () => {
			expect(computeDuckingGainAtTime(0, intervals, duckingAmount, attackMs, releaseMs)).toBe(1.0);
			expect(computeDuckingGainAtTime(500, intervals, duckingAmount, attackMs, releaseMs)).toBe(1.0);
			expect(computeDuckingGainAtTime(3000, intervals, duckingAmount, attackMs, releaseMs)).toBe(1.0);
		});

		it("returns duckingAmount when inside speech interval", () => {
			expect(computeDuckingGainAtTime(1000, intervals, duckingAmount, attackMs, releaseMs)).toBe(0.25);
			expect(computeDuckingGainAtTime(1500, intervals, duckingAmount, attackMs, releaseMs)).toBe(0.25);
			expect(computeDuckingGainAtTime(2000, intervals, duckingAmount, attackMs, releaseMs)).toBe(0.25);
		});

		it("smoothly ramps down during attack window", () => {
			// Attack window is 900ms to 1000ms
			const gain900 = computeDuckingGainAtTime(900, intervals, duckingAmount, attackMs, releaseMs);
			const gain950 = computeDuckingGainAtTime(950, intervals, duckingAmount, attackMs, releaseMs);
			const gain999 = computeDuckingGainAtTime(999, intervals, duckingAmount, attackMs, releaseMs);

			expect(gain900).toBeCloseTo(1.0, 2);
			expect(gain950).toBeGreaterThan(0.25);
			expect(gain950).toBeLessThan(1.0);
			expect(gain999).toBeCloseTo(0.25, 1);
		});

		it("smoothly ramps up during release window", () => {
			// Release window is 2000ms to 2400ms
			const gain2001 = computeDuckingGainAtTime(2001, intervals, duckingAmount, attackMs, releaseMs);
			const gain2200 = computeDuckingGainAtTime(2200, intervals, duckingAmount, attackMs, releaseMs);
			const gain2400 = computeDuckingGainAtTime(2400, intervals, duckingAmount, attackMs, releaseMs);

			expect(gain2001).toBeCloseTo(0.25, 1);
			expect(gain2200).toBeGreaterThan(0.25);
			expect(gain2200).toBeLessThan(1.0);
			expect(gain2400).toBeCloseTo(1.0, 2);
		});
	});

	describe("buildDuckingGainEnvelope", () => {
		it("builds a continuous envelope array with correct bounds", () => {
			const intervals = [{ startMs: 200, endMs: 600 }];
			const envelope = buildDuckingGainEnvelope(1000, intervals, 0.2, 50, 200, 101);

			expect(envelope.length).toBe(101);
			// Start should be ~1.0
			expect(envelope[0]).toBeCloseTo(1.0, 2);
			// Mid-speech (400ms / 1000ms = index 40) should be 0.2
			expect(envelope[40]).toBeCloseTo(0.2, 2);
			// End (1000ms = index 100) should be 1.0
			expect(envelope[100]).toBeCloseTo(1.0, 2);
		});
	});
});
