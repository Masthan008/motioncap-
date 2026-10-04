import type { Span } from "dnd-timeline";
import { useCallback, useEffect, useMemo } from "react";
import type { CursorTelemetryPoint, ZoomFocus, ZoomRegion } from "../../../types";
import { buildInteractionZoomSuggestions } from "../../zoomSuggestionUtils";
import { timelineNotifications } from "../utils/timelineNotifications";

interface UseTimelineZoomActionsParams {
	timeline: {
		videoDuration: number;
		totalMs: number;
		currentTimeMs: number;
	};
	regions: {
		zoom: ZoomRegion[];
		clip: { startMs: number; endMs: number }[];
	};
	cursorTelemetry: CursorTelemetryPoint[];
	options: {
		disableSuggestedZooms: boolean;
	};
	autoSuggestZoomsTrigger: number;
	onAutoSuggestZoomsConsumed?: () => void;
	onZoomAdded: (span: Span) => void;
	onZoomSuggested?: (span: Span, focus: ZoomFocus) => void;
}

export function useTimelineZoomActions({
	timeline,
	regions,
	cursorTelemetry,
	options,
	autoSuggestZoomsTrigger,
	onAutoSuggestZoomsConsumed,
	onZoomAdded,
	onZoomSuggested,
}: UseTimelineZoomActionsParams) {
	const { videoDuration, totalMs, currentTimeMs } = timeline;
	const { zoom: zoomRegions, clip: clipRegions } = regions;
	const { disableSuggestedZooms } = options;
	const defaultRegionDurationMs = useMemo(() => Math.min(1000, totalMs), [totalMs]);
	const MIN_ZOOM_DURATION_MS = 250;

	const getAvailableZoomPlacement = useCallback(
		(startMs: number): { start: number; end: number; adjusted?: boolean } | null => {
			if (!videoDuration || videoDuration === 0 || totalMs === 0) {
				return null;
			}

			const defaultDuration = Math.min(defaultRegionDurationMs, totalMs);
			if (defaultDuration <= 0) {
				return null;
			}

			const startPos = Math.max(0, Math.min(startMs, totalMs));
			const activeClip =
				clipRegions.length === 0
					? { startMs: 0, endMs: totalMs }
					: clipRegions.find((clip) => startPos >= clip.startMs && startPos < clip.endMs);
			if (!activeClip) {
				return null;
			}

			const sorted = [...zoomRegions].sort((a, b) => a.startMs - b.startMs);

			// 1. Direct placement check at startPos
			const isDirectlyOverlapping = sorted.some(
				(region) => startPos >= region.startMs && startPos < region.endMs,
			);
			if (!isDirectlyOverlapping) {
				const nextRegion = sorted.find((region) => region.startMs > startPos);
				const gapToNextClipEdge = activeClip.endMs - startPos;
				const gapToNextRegion = nextRegion ? nextRegion.startMs - startPos : gapToNextClipEdge;
				const availableDuration = Math.min(gapToNextClipEdge, gapToNextRegion);
				if (availableDuration >= MIN_ZOOM_DURATION_MS) {
					return {
						start: startPos,
						end: startPos + Math.min(defaultDuration, availableDuration),
					};
				}
			}

			// 2. If startPos is inside an existing zoom region, try placing right after it
			const overlappingRegion = sorted.find(
				(region) => startPos >= region.startMs && startPos < region.endMs,
			);

			const candidateStart = overlappingRegion ? overlappingRegion.endMs : startPos;
			if (candidateStart < activeClip.endMs) {
				const nextRegion = sorted.find((region) => region.startMs > candidateStart);
				const gapToNextClipEdge = activeClip.endMs - candidateStart;
				const gapToNextRegion = nextRegion ? nextRegion.startMs - candidateStart : gapToNextClipEdge;
				const availableDuration = Math.min(gapToNextClipEdge, gapToNextRegion);
				if (availableDuration >= MIN_ZOOM_DURATION_MS) {
					return {
						start: candidateStart,
						end: candidateStart + Math.min(defaultDuration, availableDuration),
						adjusted: true,
					};
				}
			}

			// 3. Check for any open slot elsewhere in the active clip
			let searchStart = activeClip.startMs;
			for (const region of sorted) {
				if (region.endMs <= activeClip.startMs) continue;
				if (region.startMs >= activeClip.endMs) break;

				const gap = Math.min(region.startMs, activeClip.endMs) - searchStart;
				if (gap >= MIN_ZOOM_DURATION_MS) {
					return {
						start: searchStart,
						end: searchStart + Math.min(defaultDuration, gap),
						adjusted: true,
					};
				}
				searchStart = Math.max(searchStart, region.endMs);
			}
			const finalGap = activeClip.endMs - searchStart;
			if (finalGap >= MIN_ZOOM_DURATION_MS) {
				return {
					start: searchStart,
					end: searchStart + Math.min(defaultDuration, finalGap),
					adjusted: true,
				};
			}

			return null;
		},
		[videoDuration, totalMs, defaultRegionDurationMs, clipRegions, zoomRegions],
	);

	const canPlaceZoomAtMs = useCallback(
		(startMs: number) => {
			return Boolean(getAvailableZoomPlacement(startMs));
		},
		[getAvailableZoomPlacement],
	);

	const addZoomAtMs = useCallback(
		(startMs: number) => {
			if (!videoDuration || videoDuration === 0 || totalMs === 0) {
				return;
			}

			const placement = getAvailableZoomPlacement(startMs);
			if (!placement) {
				timelineNotifications.warning(
					"Cannot place zoom here",
					"This clip is already filled with zoom regions. Delete or resize an existing zoom first.",
				);
				return;
			}

			onZoomAdded({ start: placement.start, end: placement.end });
			if (placement.adjusted) {
				timelineNotifications.info(
					"Zoom placed in available space",
					"Adjusted position to the nearest open timeline slot to prevent overlapping.",
				);
			}
		},
		[videoDuration, totalMs, getAvailableZoomPlacement, onZoomAdded],
	);

	const handleAddZoom = useCallback(() => {
		if (!videoDuration || videoDuration === 0 || totalMs === 0) {
			return;
		}

		addZoomAtMs(currentTimeMs);
	}, [videoDuration, totalMs, currentTimeMs, addZoomAtMs]);

	const handleSuggestZooms = useCallback(() => {
		if (!videoDuration || videoDuration === 0 || totalMs === 0) {
			return;
		}

		if (disableSuggestedZooms) {
			timelineNotifications.info(
				"Suggested zooms are unavailable while cursor looping is enabled.",
			);
			return;
		}

		if (!onZoomSuggested) {
			timelineNotifications.error("Zoom suggestion handler unavailable");
			return;
		}

		if (cursorTelemetry.length < 2) {
			timelineNotifications.info(
				"No cursor telemetry available",
				"Record a screencast first to generate cursor-based suggestions.",
			);
			return;
		}

		const defaultDuration = Math.min(defaultRegionDurationMs, totalMs);
		if (defaultDuration <= 0) {
			return;
		}

		const result = buildInteractionZoomSuggestions({
			cursorTelemetry,
			totalMs,
			defaultDurationMs: defaultDuration,
			reservedSpans: zoomRegions
				.map((region) => ({ start: region.startMs, end: region.endMs }))
				.sort((a, b) => a.start - b.start),
		});

		if (result.status === "no-telemetry") {
			timelineNotifications.info(
				"No usable cursor telemetry",
				"The recording does not include enough cursor movement data.",
			);
			return;
		}

		if (result.status === "no-interactions") {
			timelineNotifications.info(
				"No clear interaction moments found",
				"Try a recording with pauses or clicks around important actions.",
			);
			return;
		}

		if (result.status === "no-slots" || result.suggestions.length === 0) {
			timelineNotifications.info(
				"No new auto-zoom slots available",
				"All detected interaction moments are already covered by existing zoom regions.",
			);
			return;
		}

		for (const region of result.suggestions) {
			onZoomSuggested({ start: region.start, end: region.end }, region.focus);
		}

		timelineNotifications.success(
			`Added ${result.suggestions.length} interaction-based zoom suggestion${result.suggestions.length === 1 ? "" : "s"}`,
		);
	}, [
		videoDuration,
		totalMs,
		disableSuggestedZooms,
		onZoomSuggested,
		cursorTelemetry,
		defaultRegionDurationMs,
		zoomRegions,
	]);

	useEffect(() => {
		if (autoSuggestZoomsTrigger <= 0) {
			return;
		}

		onAutoSuggestZoomsConsumed?.();
		handleSuggestZooms();
	}, [autoSuggestZoomsTrigger, handleSuggestZooms, onAutoSuggestZoomsConsumed]);

	return {
		defaultRegionDurationMs,
		canPlaceZoomAtMs,
		addZoomAtMs,
		handleAddZoom,
		handleSuggestZooms,
	};
}
