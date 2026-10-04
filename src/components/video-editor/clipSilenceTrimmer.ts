import { packClipSequence } from "./clipSequence";
import { type ClipRegion, getClipSourceEndMs, getClipSourceStartMs, sortClipRegions } from "./types";

export interface SilenceSpan {
	startMs: number;
	endMs: number;
}

export interface PlanSilenceCutsOptions {
	/**
	 * Buffer in ms kept before and after speech so word boundaries don't sound chopped.
	 * Default: 100ms.
	 */
	edgePadMs?: number;
	/**
	 * Minimum speech duration in ms. Speech bursts shorter than this are treated as artifacts.
	 * Default: 120ms.
	 */
	minSpeechMs?: number;
}

export interface SilenceCutsResult {
	changed: boolean;
	clips: ClipRegion[];
	cutCount: number;
	savedMs: number;
}

/**
 * Merge overlapping and contiguous silence intervals, clamping to valid bounds.
 */
export function normalizeSilenceIntervals(
	intervals: SilenceSpan[],
	sourceDurationMs: number,
	edgePadMs = 100,
): SilenceSpan[] {
	if (!intervals || intervals.length === 0 || sourceDurationMs <= 0) {
		return [];
	}

	const padded: SilenceSpan[] = [];
	for (const interval of intervals) {
		const rawStart = Math.max(0, interval.startMs);
		const rawEnd = Number.isFinite(interval.endMs)
			? Math.min(sourceDurationMs, interval.endMs)
			: sourceDurationMs;

		const startMs = Math.round(rawStart + edgePadMs);
		const endMs = Math.round(rawEnd - edgePadMs);

		// Only retain silence that is long enough after padding
		if (endMs > startMs) {
			padded.push({ startMs, endMs });
		}
	}

	if (padded.length === 0) {
		return [];
	}

	// Sort by startMs
	padded.sort((a, b) => a.startMs - b.startMs);

	const merged: SilenceSpan[] = [padded[0]];
	for (let i = 1; i < padded.length; i++) {
		const current = padded[i];
		const prev = merged[merged.length - 1];

		if (current.startMs <= prev.endMs) {
			prev.endMs = Math.max(prev.endMs, current.endMs);
		} else {
			merged.push(current);
		}
	}

	return merged;
}

/**
 * Plans silence cuts across all clips, removing dead air intervals while preserving
 * continuous speech and clip speeds.
 */
export function planSilenceCuts(params: {
	clipRegions: ClipRegion[];
	silences: SilenceSpan[];
	sourceDurationMs: number;
	createId: () => string;
	options?: PlanSilenceCutsOptions;
}): SilenceCutsResult {
	const { clipRegions, silences, sourceDurationMs, createId, options } = params;
	const edgePadMs = options?.edgePadMs ?? 100;
	const minSpeechMs = options?.minSpeechMs ?? 120;

	if (!clipRegions || clipRegions.length === 0 || !silences || silences.length === 0) {
		return { changed: false, clips: clipRegions ?? [], cutCount: 0, savedMs: 0 };
	}

	const normalizedSilences = normalizeSilenceIntervals(silences, sourceDurationMs, edgePadMs);
	if (normalizedSilences.length === 0) {
		return { changed: false, clips: clipRegions, cutCount: 0, savedMs: 0 };
	}

	const orderedClips = sortClipRegions(clipRegions);
	const initialDurationMs = orderedClips.reduce(
		(sum, c) => sum + Math.max(0, c.endMs - c.startMs),
		0,
	);

	const nextClips: ClipRegion[] = [];
	let totalCuts = 0;

	for (const clip of orderedClips) {
		const clipSrcStart = getClipSourceStartMs(clip);
		const clipSrcEnd = getClipSourceEndMs(clip);
		const speed = Number.isFinite(clip.speed) && clip.speed > 0 ? clip.speed : 1;

		if (clipSrcEnd <= clipSrcStart) {
			continue;
		}

		// Find silence intervals overlapping this clip's source range
		const overlapping = normalizedSilences
			.filter((s) => s.endMs > clipSrcStart && s.startMs < clipSrcEnd)
			.map((s) => ({
				startMs: Math.max(clipSrcStart, s.startMs),
				endMs: Math.min(clipSrcEnd, s.endMs),
			}));

		if (overlapping.length === 0) {
			// No silence in this clip, keep as is
			nextClips.push(clip);
			continue;
		}

		// Carve out the speech segments
		let cursor = clipSrcStart;
		const speechSegments: Array<{ startMs: number; endMs: number }> = [];

		for (const sil of overlapping) {
			if (sil.startMs > cursor) {
				const duration = sil.startMs - cursor;
				if (duration >= minSpeechMs) {
					speechSegments.push({ startMs: cursor, endMs: sil.startMs });
				}
			}
			cursor = Math.max(cursor, sil.endMs);
			totalCuts++;
		}

		if (cursor < clipSrcEnd) {
			const duration = clipSrcEnd - cursor;
			if (duration >= minSpeechMs) {
				speechSegments.push({ startMs: cursor, endMs: clipSrcEnd });
			}
		}

		if (speechSegments.length === 0) {
			// Entire clip was silent, omitting it
			continue;
		}

		for (const seg of speechSegments) {
			const segSourceDuration = seg.endMs - seg.startMs;
			const segTimelineDuration = Math.max(1, Math.round(segSourceDuration / speed));

			nextClips.push({
				...clip,
				id: createId(),
				sourceStartMs: seg.startMs,
				startMs: 0,
				endMs: segTimelineDuration,
			});
		}
	}

	if (nextClips.length === 0) {
		// Do not leave timeline completely empty in edge cases
		return { changed: false, clips: clipRegions, cutCount: 0, savedMs: 0 };
	}

	const packed = packClipSequence(nextClips);
	const newDurationMs = packed.reduce((sum, c) => sum + Math.max(0, c.endMs - c.startMs), 0);
	const savedMs = Math.max(0, initialDurationMs - newDurationMs);

	if (savedMs <= 0 && packed.length === clipRegions.length) {
		return { changed: false, clips: clipRegions, cutCount: 0, savedMs: 0 };
	}

	return {
		changed: true,
		clips: packed,
		cutCount: totalCuts,
		savedMs,
	};
}
