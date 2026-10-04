import {
	type ClipRegion,
	type ClipTransition,
	type ClipTransitionType,
	DEFAULT_TRANSITION_DURATION_MS,
	MAX_TRANSITION_DURATION_MS,
	MIN_TRANSITION_DURATION_MS,
	sortClipRegions,
} from "./types";

export type { ClipTransitionType };

export interface TransitionTransform {
	scale: number;
	translateXPercent: number;
	translateYPercent: number;
	opacity: number;
}

export interface TransitionVisualState {
	dipColor?: "black" | "white";
	dipOpacity: number;
	transform: TransitionTransform;
}

export interface ActiveClipTransition extends TransitionVisualState {
	type: ClipTransitionType;
	clipId: string;
	seamMs: number;
	windowStartMs: number;
	windowEndMs: number;
	durationMs: number;
	progress: number;
	isOutgoing: boolean;
}

export const CLIP_TRANSITION_OPTIONS: Array<{
	value: ClipTransitionType;
	label: string;
	shortLabel: string;
}> = [
	{ value: "none", label: "None (Direct Cut)", shortLabel: "Cut" },
	{ value: "crossfade", label: "Crossfade", shortLabel: "Fade" },
	{ value: "dip-black", label: "Dip to Black", shortLabel: "Dip Black" },
	{ value: "dip-white", label: "Dip to White (Flash)", shortLabel: "Dip White" },
	{ value: "slide-left", label: "Slide Left", shortLabel: "Slide L" },
	{ value: "slide-right", label: "Slide Right", shortLabel: "Slide R" },
	{ value: "slide-up", label: "Slide Up", shortLabel: "Slide U" },
	{ value: "slide-down", label: "Slide Down", shortLabel: "Slide D" },
	{ value: "zoom-in", label: "Zoom Punch", shortLabel: "Zoom" },
];

export function getClipTransitionLabel(type: ClipTransitionType): string {
	const option = CLIP_TRANSITION_OPTIONS.find((opt) => opt.value === type);
	return option ? option.label : "None";
}

export function getClipTransitionShortLabel(type: ClipTransitionType): string {
	const option = CLIP_TRANSITION_OPTIONS.find((opt) => opt.value === type);
	return option ? option.shortLabel : "Cut";
}

export function normalizeClipTransition(raw: unknown): ClipTransition | undefined {
	if (!raw || typeof raw !== "object") return undefined;
	const candidate = raw as Partial<ClipTransition>;
	if (
		typeof candidate.type !== "string" ||
		!CLIP_TRANSITION_OPTIONS.some((opt) => opt.value === candidate.type) ||
		candidate.type === "none"
	) {
		return undefined;
	}

	const durationMs =
		typeof candidate.durationMs === "number" && Number.isFinite(candidate.durationMs)
			? Math.max(MIN_TRANSITION_DURATION_MS, Math.min(MAX_TRANSITION_DURATION_MS, Math.round(candidate.durationMs)))
			: DEFAULT_TRANSITION_DURATION_MS;

	return {
		type: candidate.type as ClipTransitionType,
		durationMs,
	};
}

/**
 * Computes visual properties (dip overlay and geometric transform) for a transition at a given progress (0..1).
 */
export function computeTransitionVisualState(
	type: ClipTransitionType,
	progress: number,
): TransitionVisualState {
	const p = Math.max(0, Math.min(1, progress));
	const bell = Math.sin(p * Math.PI); // Peaks at 1.0 when p = 0.5 (the seam cut point)

	switch (type) {
		case "dip-black":
			return {
				dipColor: "black",
				dipOpacity: bell,
				transform: { scale: 1, translateXPercent: 0, translateYPercent: 0, opacity: 1 },
			};

		case "dip-white":
			return {
				dipColor: "white",
				dipOpacity: bell,
				transform: { scale: 1, translateXPercent: 0, translateYPercent: 0, opacity: 1 },
			};

		case "crossfade":
			return {
				dipOpacity: 0,
				transform: {
					scale: 1 + 0.04 * bell,
					translateXPercent: 0,
					translateYPercent: 0,
					opacity: Math.max(0, 1 - 0.45 * bell),
				},
			};

		case "zoom-in":
			return {
				dipOpacity: 0,
				transform: {
					scale: 1 + 0.22 * bell,
					translateXPercent: 0,
					translateYPercent: 0,
					opacity: 1,
				},
			};

		case "slide-left": {
			// Outgoing moves from 0 to -50%; incoming moves from +50% to 0
			const tx = p < 0.5 ? -p * 100 : (1 - p) * 100;
			return {
				dipOpacity: 0,
				transform: {
					scale: 1,
					translateXPercent: tx,
					translateYPercent: 0,
					opacity: 1,
				},
			};
		}

		case "slide-right": {
			// Outgoing moves from 0 to +50%; incoming moves from -50% to 0
			const tx = p < 0.5 ? p * 100 : -(1 - p) * 100;
			return {
				dipOpacity: 0,
				transform: {
					scale: 1,
					translateXPercent: tx,
					translateYPercent: 0,
					opacity: 1,
				},
			};
		}

		case "slide-up": {
			// Outgoing moves from 0 to -50%; incoming moves from +50% to 0
			const ty = p < 0.5 ? -p * 100 : (1 - p) * 100;
			return {
				dipOpacity: 0,
				transform: {
					scale: 1,
					translateXPercent: 0,
					translateYPercent: ty,
					opacity: 1,
				},
			};
		}

		case "slide-down": {
			// Outgoing moves from 0 to +50%; incoming moves from -50% to 0
			const ty = p < 0.5 ? p * 100 : -(1 - p) * 100;
			return {
				dipOpacity: 0,
				transform: {
					scale: 1,
					translateXPercent: 0,
					translateYPercent: ty,
					opacity: 1,
				},
			};
		}

		case "none":
		default:
			return {
				dipOpacity: 0,
				transform: { scale: 1, translateXPercent: 0, translateYPercent: 0, opacity: 1 },
			};
	}
}

/**
 * Calculates whether any clip transition is active at the specified timeline time.
 */
export function getActiveClipTransition(
	timeMs: number,
	clips: ClipRegion[],
): ActiveClipTransition | null {
	if (!Number.isFinite(timeMs) || !Array.isArray(clips) || clips.length === 0) {
		return null;
	}

	const sorted = sortClipRegions(clips);

	for (let i = 0; i < sorted.length; i++) {
		const clip = sorted[i];
		const transition = clip.transition;
		if (!transition || transition.type === "none") continue;

		const requestedDuration = Number.isFinite(transition.durationMs)
			? Math.max(MIN_TRANSITION_DURATION_MS, Math.min(MAX_TRANSITION_DURATION_MS, transition.durationMs))
			: DEFAULT_TRANSITION_DURATION_MS;

		if (i === 0) {
			// Intro transition into the initial clip
			const seamMs = clip.startMs;
			const maxDuration = Math.max(0, clip.endMs - clip.startMs);
			const durationMs = Math.min(requestedDuration, maxDuration);
			const windowStartMs = seamMs;
			const windowEndMs = seamMs + durationMs;

			if (timeMs >= windowStartMs && timeMs <= windowEndMs && durationMs > 0) {
				const progress = Math.max(0, Math.min(1, (timeMs - windowStartMs) / durationMs));
				const visual = computeTransitionVisualState(transition.type, progress);
				return {
					...visual,
					type: transition.type,
					clipId: clip.id,
					seamMs,
					windowStartMs,
					windowEndMs,
					durationMs,
					progress,
					isOutgoing: false,
				};
			}
		} else {
			// Transition across seam between sorted[i - 1] and sorted[i]
			const prevClip = sorted[i - 1];
			const seamMs = clip.startMs;

			// Clips must be contiguous
			if (prevClip.endMs !== clip.startMs) continue;

			const prevClipDuration = Math.max(0, prevClip.endMs - prevClip.startMs);
			const currClipDuration = Math.max(0, clip.endMs - clip.startMs);

			const halfDuration = Math.min(
				requestedDuration / 2,
				prevClipDuration / 2,
				currClipDuration / 2,
			);

			if (halfDuration <= 0) continue;

			const windowStartMs = seamMs - halfDuration;
			const windowEndMs = seamMs + halfDuration;
			const totalWindow = windowEndMs - windowStartMs;

			if (timeMs >= windowStartMs && timeMs <= windowEndMs && totalWindow > 0) {
				const progress = Math.max(0, Math.min(1, (timeMs - windowStartMs) / totalWindow));
				const visual = computeTransitionVisualState(transition.type, progress);
				return {
					...visual,
					type: transition.type,
					clipId: clip.id,
					seamMs,
					windowStartMs,
					windowEndMs,
					durationMs: Math.round(totalWindow),
					progress,
					isOutgoing: timeMs < seamMs,
				};
			}
		}
	}

	return null;
}
