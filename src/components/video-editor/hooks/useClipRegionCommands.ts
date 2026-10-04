import type { ClipSequenceSpan } from "../timeline/core/timelineTypes";
import {
	type Dispatch,
	type MutableRefObject,
	type SetStateAction,
	useCallback,
	useState,
} from "react";
import { toast } from "@/components/ui/toast";
import { changeClipSpan } from "../clipSpanChange";
import {
	packClipSequence,
	reorderClipSequence,
	rippleRegionAnchors,
	rippleRegions,
} from "../clipSequence";
import { planSilenceCuts } from "../clipSilenceTrimmer";
import { getClipSourceStartMs, type AnnotationRegion, type AudioRegion } from "../types";
import { planClipSplit } from "../clipSplit";
import type { ClipRegion, ClipTransition, EditorEffectSection, ZoomRegion } from "../types";
import { supportsPreviewPlaybackRate } from "../videoPlayback/playbackRate";

type Translator = (
	key: string,
	fallback?: string,
	params?: Record<string, string | number>,
) => string;

interface UseClipRegionCommandsParams {
	setAnnotationRegions: Dispatch<SetStateAction<AnnotationRegion[]>>;
	setAudioRegions: Dispatch<SetStateAction<AudioRegion[]>>;
	sourceDurationMs: number;
	clipRegions: ClipRegion[];
	setClipRegions: Dispatch<SetStateAction<ClipRegion[]>>;
	zoomRegions: ZoomRegion[];
	setZoomRegions: Dispatch<SetStateAction<ZoomRegion[]>>;
	selectedClipId: string | null;
	setSelectedClipId: Dispatch<SetStateAction<string | null>>;
	setSelectedZoomId: Dispatch<SetStateAction<string | null>>;
	setSelectedAnnotationId: Dispatch<SetStateAction<string | null>>;
	setSelectedAudioId: Dispatch<SetStateAction<string | null>>;
	setSelectedCaptionId: Dispatch<SetStateAction<string | null>>;
	setActiveEffectSection: Dispatch<SetStateAction<EditorEffectSection>>;
	nextClipIdRef: MutableRefObject<number>;
	videoPath?: string | null;
	t: Translator;
}

export function useClipRegionCommands({
	setAnnotationRegions,
	setAudioRegions,
	sourceDurationMs,
	clipRegions,
	setClipRegions,
	setZoomRegions,
	selectedClipId,
	setSelectedClipId,
	setSelectedZoomId,
	setSelectedAnnotationId,
	setSelectedAudioId,
	setSelectedCaptionId,
	setActiveEffectSection,
	nextClipIdRef,
	videoPath,
	t,
}: UseClipRegionCommandsParams) {
	const [isTrimmingSilence, setIsTrimmingSilence] = useState(false);

	const applySequence = useCallback(
		(edited: ClipRegion[]) => {
			const next = packClipSequence(edited);
			setClipRegions(next);
			setZoomRegions((current) => rippleRegions(current, clipRegions, next));
			setAnnotationRegions((current) => rippleRegions(current, clipRegions, next));
			setAudioRegions((current) => rippleRegionAnchors(current, clipRegions, next));
		},
		[clipRegions, setClipRegions, setZoomRegions, setAnnotationRegions, setAudioRegions],
	);

	const handleSelectClip = useCallback(
		(id: string | null) => {
			setSelectedClipId(id);
			if (id) {
				setActiveEffectSection("clip");
				setSelectedZoomId(null);
				setSelectedAnnotationId(null);
				setSelectedAudioId(null);
				setSelectedCaptionId(null);
			} else {
				setActiveEffectSection((section) => (section === "clip" ? "scene" : section));
			}
		},
		[
			setActiveEffectSection,
			setSelectedAnnotationId,
			setSelectedAudioId,
			setSelectedCaptionId,
			setSelectedClipId,
			setSelectedZoomId,
		],
	);

	const handleClipSplit = useCallback(
		(splitMs: number) => {
			const plan = planClipSplit({
				clipRegions,
				splitMs,
				createId: () => `clip-${nextClipIdRef.current++}`,
			});
			if (!plan) return;
			setClipRegions((current) =>
				current.flatMap((clip) =>
					clip.id === plan.targetId ? [plan.left, plan.right] : [clip],
				),
			);
			if (selectedClipId === plan.targetId) setSelectedClipId(plan.left.id);
		},
		[clipRegions, nextClipIdRef, selectedClipId, setClipRegions, setSelectedClipId],
	);

	const handleClipSpanChange = useCallback(
		(id: string, span: ClipSequenceSpan) => {
			const oldClip = clipRegions.find((clip) => clip.id === id);
			const newStart = Math.round(span.start);
			const newEnd = Math.round(span.end);

			if (!oldClip) return;
			if (span.sequenceIndex !== undefined) {
				applySequence(reorderClipSequence(clipRegions, id, span.sequenceIndex));
				return;
			}
			applySequence(
				clipRegions.map((clip) =>
					clip.id === id
						? changeClipSpan(clip, newStart, newEnd, sourceDurationMs)
						: clip,
				),
			);
		},
		[clipRegions, applySequence, sourceDurationMs],
	);

	const handleClipSpeedChange = useCallback(
		(speed: number) => {
			if (!selectedClipId || !Number.isFinite(speed) || speed <= 0) return;
			if (!supportsPreviewPlaybackRate(speed)) {
				toast.error(
					t(
						"editor.timeline.unsupportedSpeed",
						"This speed is not supported for preview on this device.",
					),
				);
				return;
			}

			applySequence(
				clipRegions.map((clip) =>
					clip.id === selectedClipId
						? {
								...clip,
								sourceStartMs: getClipSourceStartMs(clip),
								speed,
								endMs:
									clip.startMs +
									Math.max(
										1,
										Math.round(
											((clip.endMs - clip.startMs) * clip.speed) / speed,
										),
									),
							}
						: clip,
				),
			);
		},
		[clipRegions, selectedClipId, applySequence, t],
	);

	const handleClipMutedChange = useCallback(
		(muted: boolean) => {
			if (!selectedClipId) return;
			setClipRegions((current) =>
				current.map((clip) => (clip.id === selectedClipId ? { ...clip, muted } : clip)),
			);
		},
		[selectedClipId, setClipRegions],
	);
	const handleClipShowSourceAudioChange = useCallback(
		(showSourceAudio: boolean) => {
			if (!selectedClipId) return;
			setClipRegions((current) =>
				current.map((clip) =>
					clip.id === selectedClipId ? { ...clip, showSourceAudio } : clip,
				),
			);
		},
		[selectedClipId, setClipRegions],
	);

	const handleClipTransitionChange = useCallback(
		(transition: ClipTransition | undefined) => {
			if (!selectedClipId) return;
			setClipRegions((current) =>
				current.map((clip) =>
					clip.id === selectedClipId ? { ...clip, transition } : clip,
				),
			);
		},
		[selectedClipId, setClipRegions],
	);

	const handleClipDelete = useCallback(
		(id: string) => {
			applySequence(clipRegions.filter((clip) => clip.id !== id));
			if (selectedClipId === id) setSelectedClipId(null);
		},
		[clipRegions, selectedClipId, applySequence, setSelectedClipId],
	);

	const handleAutoCutSilences = useCallback(
		async (options?: {
			minSilenceDurationS?: number;
			noiseFloorDb?: number;
			edgePadMs?: number;
			minSpeechMs?: number;
		}) => {
			if (!videoPath) {
				toast.error(
					t("editor.toolbar.silenceNoVideo", "No video loaded to analyze silence."),
				);
				return { success: false };
			}

			if (!window.electronAPI?.detectSilenceIntervals) {
				toast.error(
					t(
						"editor.toolbar.silenceUnavailable",
						"Silence detection is only available in the MotionCap desktop app.",
					),
				);
				return { success: false };
			}

			if (isTrimmingSilence) {
				return { success: false };
			}

			setIsTrimmingSilence(true);
			try {
				toast.info(
					t("editor.toolbar.silenceDetecting", "Analyzing audio for pauses and dead air..."),
				);
				const response = await window.electronAPI.detectSilenceIntervals({
					videoPath,
					minSilenceDurationS: options?.minSilenceDurationS ?? 0.6,
					noiseFloorDb: options?.noiseFloorDb ?? -30,
				});

				if (!response.success || !response.intervals) {
					if (response.noAudio) {
						toast.warning(
							t(
								"editor.toolbar.silenceNoAudio",
								"No audio track detected in this recording. Silence trimming requires audio.",
							),
						);
						return { success: false, error: "No audio track" };
					}

					const errorMsg =
						response.error ??
						t("editor.toolbar.silenceFailed", "Failed to detect silence intervals.");
					toast.error(errorMsg, {
						description: response.details ? "Click Copy to view technical details." : undefined,
					});
					return { success: false, error: errorMsg };
				}

				if (response.intervals.length === 0) {
					toast.info(
						t(
							"editor.toolbar.silenceNoneFound",
							"No significant silent pauses found in the recording.",
						),
					);
					return { success: true, count: 0 };
				}

				const result = planSilenceCuts({
					clipRegions,
					silences: response.intervals,
					sourceDurationMs,
					createId: () => `clip-${nextClipIdRef.current++}`,
					options: {
						edgePadMs: options?.edgePadMs ?? 100,
						minSpeechMs: options?.minSpeechMs ?? 120,
					},
				});

				if (!result.changed || result.clips.length === 0) {
					toast.info(
						t(
							"editor.toolbar.silenceNoChange",
							"All detected pauses are already trimmed or covered.",
						),
					);
					return { success: true, count: 0 };
				}

				applySequence(result.clips);

				const savedSeconds = (result.savedMs / 1000).toFixed(1);
				toast.success(
					t(
						"editor.toolbar.silenceSuccess",
						`Trimmed ${result.cutCount} silent pause(s), saving ${savedSeconds}s!`,
						{ count: result.cutCount, seconds: savedSeconds },
					),
				);
				return { success: true, count: result.cutCount, savedMs: result.savedMs };
			} catch (err) {
				const message = err instanceof Error ? err.message : String(err);
				toast.error(message);
				return { success: false, error: message };
			} finally {
				setIsTrimmingSilence(false);
			}
		},
		[
			videoPath,
			isTrimmingSilence,
			clipRegions,
			sourceDurationMs,
			nextClipIdRef,
			applySequence,
			t,
		],
	);

	return {
		handleSelectClip,
		handleClipSplit,
		handleClipSpanChange,
		handleClipSpeedChange,
		handleClipMutedChange,
		handleClipShowSourceAudioChange,
		handleClipTransitionChange,
		handleClipDelete,
		handleAutoCutSilences,
		isTrimmingSilence,
	};
}
