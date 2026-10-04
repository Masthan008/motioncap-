import type { ChapterMarker } from "../types";

/**
 * Formats milliseconds into a standard video chapter timestamp.
 * Returns MM:SS, or HH:MM:SS if duration exceeds one hour or forceHours is true.
 */
export function formatChapterTimestamp(timeMs: number, forceHours = false): string {
	const totalSeconds = Math.max(0, Math.floor(timeMs / 1000));
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;

	const mm = String(minutes).padStart(2, "0");
	const ss = String(seconds).padStart(2, "0");

	if (hours > 0 || forceHours) {
		const hh = String(hours).padStart(2, "0");
		return `${hh}:${mm}:${ss}`;
	}

	return `${mm}:${ss}`;
}

/**
 * Sorts chapter markers chronologically by timeMs.
 */
export function sortChapterMarkers(markers: ChapterMarker[]): ChapterMarker[] {
	return [...markers].sort((a, b) => a.timeMs - b.timeMs);
}

/**
 * Formats a list of chapter markers for YouTube description copy/paste.
 * YouTube chapter rules:
 * - The first timestamp must start at 00:00.
 * - Timestamps must be in ascending chronological order.
 * - Each chapter must be on a new line formatted as "<timestamp> <title>".
 */
export function formatYouTubeChapters(
	markers: ChapterMarker[],
	totalDurationMs?: number,
): string {
	if (!markers || markers.length === 0) {
		return "";
	}

	const sorted = sortChapterMarkers(markers);
	const requiresHours =
		(totalDurationMs !== undefined && totalDurationMs >= 3600000) ||
		sorted.some((m) => m.timeMs >= 3600000);

	const chaptersToExport: ChapterMarker[] = [];

	// YouTube strictly requires a chapter at 00:00
	const firstMarker = sorted[0];
	if (!firstMarker || firstMarker.timeMs > 0) {
		chaptersToExport.push({
			id: "auto-intro",
			timeMs: 0,
			title: "Intro",
		});
	}

	for (const marker of sorted) {
		// Avoid duplicate 00:00 chapters
		if (marker.timeMs === 0 && chaptersToExport.length > 0 && chaptersToExport[0].timeMs === 0) {
			chaptersToExport[0] = marker;
		} else {
			chaptersToExport.push(marker);
		}
	}

	return chaptersToExport
		.map((marker) => {
			const timestamp = formatChapterTimestamp(marker.timeMs, requiresHours);
			const title = marker.title.trim() || `Chapter at ${timestamp}`;
			return `${timestamp} ${title}`;
		})
		.join("\n");
}

/**
 * Creates a new chapter marker at the designated timeline timestamp.
 */
export function createChapterMarker(
	timeMs: number,
	customTitle?: string,
	existingMarkers?: ChapterMarker[],
): ChapterMarker {
	const clampedTime = Math.max(0, Math.round(timeMs));
	const id = `chap_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

	if (customTitle && customTitle.trim()) {
		return {
			id,
			timeMs: clampedTime,
			title: customTitle.trim(),
		};
	}

	if (clampedTime === 0) {
		return {
			id,
			timeMs: clampedTime,
			title: "Intro",
		};
	}

	const count = existingMarkers ? existingMarkers.length + 1 : 1;
	return {
		id,
		timeMs: clampedTime,
		title: `Chapter ${count}`,
	};
}

/**
 * Validates and normalizes chapter marker data from persistence or presets.
 */
export function normalizeChapterMarkers(data: unknown): ChapterMarker[] {
	if (!Array.isArray(data)) {
		return [];
	}

	const normalized: ChapterMarker[] = [];
	for (const item of data) {
		if (!item || typeof item !== "object") {
			continue;
		}

		const candidate = item as Partial<ChapterMarker>;
		if (typeof candidate.timeMs !== "number" || !Number.isFinite(candidate.timeMs)) {
			continue;
		}

		const id = typeof candidate.id === "string" && candidate.id.trim()
			? candidate.id.trim()
			: `chap_${Math.random().toString(36).slice(2, 7)}`;

		const title = typeof candidate.title === "string" && candidate.title.trim()
			? candidate.title.trim()
			: "Chapter";

		normalized.push({
			id,
			timeMs: Math.max(0, Math.round(candidate.timeMs)),
			title,
		});
	}

	return sortChapterMarkers(normalized);
}
