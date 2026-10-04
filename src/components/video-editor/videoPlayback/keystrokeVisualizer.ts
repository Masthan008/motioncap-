import type { CursorTelemetryPoint } from "../types";

export interface ActiveKeystrokeState {
	keystroke: string;
	timeMs: number;
	elapsedMs: number;
	progress: number; // 0 (just pressed) -> 1 (about to expire)
	opacity: number;
	scale: number;
}

export const DEFAULT_KEYSTROKE_DURATION_MS = 1400;

/**
 * Searches for the active keystroke at a given playback timestamp.
 * If a shortcut occurred within `maxAgeMs` before `timeMs`, returns its state and smooth animation curve.
 */
export function findActiveKeystrokeSample(
	samples: CursorTelemetryPoint[] | undefined,
	timeMs: number,
	maxAgeMs: number = DEFAULT_KEYSTROKE_DURATION_MS,
): ActiveKeystrokeState | null {
	if (!samples || samples.length === 0 || !Number.isFinite(timeMs)) {
		return null;
	}

	// Binary search for highest index where sample.timeMs <= timeMs
	let lo = 0;
	let hi = samples.length - 1;
	while (lo < hi) {
		const mid = Math.ceil((lo + hi) / 2);
		if (samples[mid].timeMs <= timeMs) {
			lo = mid;
		} else {
			hi = mid - 1;
		}
	}

	if (samples[lo]?.timeMs > timeMs) {
		return null;
	}

	// Scan backwards from `lo` up to maxAgeMs window
	for (let i = lo; i >= 0; i--) {
		const sample = samples[i];
		const elapsedMs = timeMs - sample.timeMs;
		if (elapsedMs < 0) continue;
		if (elapsedMs > maxAgeMs) break;

		if (sample.keystroke && sample.keystroke.trim().length > 0) {
			const progress = Math.min(1, Math.max(0, elapsedMs / maxAgeMs));

			// Calculate smooth spring/fade animation curve
			// 0..0.12: Rapid pop in (scale 0.88 -> 1.0, opacity 0 -> 1)
			// 0.12..0.80: Fully visible
			// 0.80..1.0: Gentle fade out (scale 1.0 -> 0.95, opacity 1 -> 0)
			let opacity = 1;
			let scale = 1;

			if (progress < 0.12) {
				const inT = progress / 0.12;
				opacity = inT;
				scale = 0.88 + 0.12 * Math.sin((inT * Math.PI) / 2);
			} else if (progress > 0.8) {
				const outT = (progress - 0.8) / 0.2;
				opacity = Math.max(0, 1 - outT);
				scale = 1 - 0.05 * outT;
			}

			return {
				keystroke: sample.keystroke,
				timeMs: sample.timeMs,
				elapsedMs,
				progress,
				opacity,
				scale,
			};
		}
	}

	return null;
}

/**
 * Splits a shortcut string like "Ctrl + Shift + P" or "Cmd + K" into individual key tokens.
 */
export function parseShortcutTokens(keystroke: string): string[] {
	if (!keystroke || typeof keystroke !== "string") {
		return [];
	}

	return keystroke
		.split(/\s*\+\s*/)
		.map((part) => part.trim())
		.filter((part) => part.length > 0);
}

/**
 * Returns a friendly display label or Mac/Win symbol for a key token.
 */
export function formatKeycapLabel(token: string): string {
	const lower = token.toLowerCase();
	switch (lower) {
		case "meta":
		case "cmd":
		case "command":
			return "⌘";
		case "alt":
		case "opt":
		case "option":
			return "Alt";
		case "shift":
			return "Shift";
		case "ctrl":
		case "control":
			return "Ctrl";
		case "esc":
		case "escape":
			return "Esc";
		case "backspace":
			return "⌫";
		case "delete":
		case "del":
			return "Del";
		case "enter":
		case "return":
			return "↵";
		case "tab":
			return "Tab";
		case "space":
			return "Space";
		case "up":
		case "arrowup":
			return "↑";
		case "down":
		case "arrowdown":
			return "↓";
		case "left":
		case "arrowleft":
			return "←";
		case "right":
		case "arrowright":
			return "→";
		default:
			return token;
	}
}
