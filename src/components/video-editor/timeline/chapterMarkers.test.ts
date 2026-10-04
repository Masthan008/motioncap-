import { describe, expect, it } from "vitest";
import {
	createChapterMarker,
	formatChapterTimestamp,
	formatYouTubeChapters,
	normalizeChapterMarkers,
	sortChapterMarkers,
} from "./chapterMarkers";

describe("chapterMarkers", () => {
	describe("formatChapterTimestamp", () => {
		it("formats sub-minute and minute timestamps as MM:SS", () => {
			expect(formatChapterTimestamp(0)).toBe("00:00");
			expect(formatChapterTimestamp(45000)).toBe("00:45");
			expect(formatChapterTimestamp(75000)).toBe("01:15");
			expect(formatChapterTimestamp(599000)).toBe("09:59");
		});

		it("formats timestamps >= 1 hour as HH:MM:SS", () => {
			expect(formatChapterTimestamp(3600000)).toBe("01:00:00");
			expect(formatChapterTimestamp(3665000)).toBe("01:01:05");
			expect(formatChapterTimestamp(7325000)).toBe("02:02:05");
		});

		it("respects forceHours parameter", () => {
			expect(formatChapterTimestamp(75000, true)).toBe("00:01:15");
		});
	});

	describe("sortChapterMarkers", () => {
		it("sorts markers chronologically by timeMs", () => {
			const markers = [
				{ id: "3", timeMs: 3000, title: "Third" },
				{ id: "1", timeMs: 1000, title: "First" },
				{ id: "2", timeMs: 2000, title: "Second" },
			];
			const sorted = sortChapterMarkers(markers);
			expect(sorted.map((m) => m.id)).toEqual(["1", "2", "3"]);
		});
	});

	describe("formatYouTubeChapters", () => {
		it("returns empty string when markers list is empty", () => {
			expect(formatYouTubeChapters([])).toBe("");
		});

		it("prepends an automatic 00:00 Intro chapter if first marker is after 0", () => {
			const markers = [
				{ id: "1", timeMs: 45000, title: "Getting Started" },
				{ id: "2", timeMs: 120000, title: "Feature Overview" },
			];
			const output = formatYouTubeChapters(markers);
			expect(output).toBe("00:00 Intro\n00:45 Getting Started\n02:00 Feature Overview");
		});

		it("keeps existing 00:00 chapter title without adding duplicate", () => {
			const markers = [
				{ id: "1", timeMs: 0, title: "Welcome & Agenda" },
				{ id: "2", timeMs: 90000, title: "Live Demo" },
			];
			const output = formatYouTubeChapters(markers);
			expect(output).toBe("00:00 Welcome & Agenda\n01:30 Live Demo");
		});

		it("formats with HH:MM:SS if total duration exceeds one hour", () => {
			const markers = [
				{ id: "1", timeMs: 0, title: "Start" },
				{ id: "2", timeMs: 3700000, title: "Late Section" },
			];
			const output = formatYouTubeChapters(markers, 4000000);
			expect(output).toBe("00:00:00 Start\n01:01:40 Late Section");
		});
	});

	describe("createChapterMarker and normalizeChapterMarkers", () => {
		it("creates chapter marker with reasonable defaults", () => {
			const marker0 = createChapterMarker(0);
			expect(marker0.timeMs).toBe(0);
			expect(marker0.title).toBe("Intro");

			const marker1 = createChapterMarker(15000, undefined, [marker0]);
			expect(marker1.timeMs).toBe(15000);
			expect(marker1.title).toBe("Chapter 2");

			const markerCustom = createChapterMarker(20000, "Custom Title");
			expect(markerCustom.title).toBe("Custom Title");
		});

		it("normalizes and sanitizes arbitrary input data", () => {
			const valid = normalizeChapterMarkers([
				{ id: "a", timeMs: 5000, title: "Five" },
				null,
				"invalid",
				{ id: "b", timeMs: 1000, title: "One" },
				{ timeMs: -200, title: "Negative" },
			]);
			expect(valid).toHaveLength(3);
			expect(valid[0].timeMs).toBe(0); // clamped -200 to 0
			expect(valid[1].timeMs).toBe(1000);
			expect(valid[2].timeMs).toBe(5000);
		});
	});
});
