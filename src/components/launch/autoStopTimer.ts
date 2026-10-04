export interface AutoStopPreset {
	seconds: number;
	label: string;
}

export const AUTO_STOP_PRESETS: readonly AutoStopPreset[] = [
	{ seconds: 0, label: "Off" },
	{ seconds: 60, label: "1 min" },
	{ seconds: 180, label: "3 min" },
	{ seconds: 300, label: "5 min" },
	{ seconds: 600, label: "10 min" },
	{ seconds: 900, label: "15 min" },
	{ seconds: 1800, label: "30 min" },
	{ seconds: 2700, label: "45 min" },
	{ seconds: 3600, label: "60 min" },
] as const;

export function clampAutoStopSeconds(seconds: number): number {
	if (Number.isNaN(seconds) || seconds < 0) return 0;
	// Max limit of 6 hours (21600 seconds)
	return Math.min(Math.floor(seconds), 21600);
}

export function formatAutoStopPresetLabel(seconds: number): string {
	if (seconds <= 0) return "Off";
	if (seconds < 60) return `${seconds}s`;
	const mins = Math.floor(seconds / 60);
	const remainingSecs = seconds % 60;
	if (remainingSecs === 0) {
		return `${mins}m`;
	}
	return `${mins}m ${remainingSecs}s`;
}

export function calculateAutoStopRemaining(
	elapsedSeconds: number,
	limitSeconds: number | null | undefined,
): number | null {
	if (limitSeconds === null || limitSeconds === undefined || limitSeconds <= 0) {
		return null;
	}
	return Math.max(0, limitSeconds - Math.max(0, elapsedSeconds));
}

export function formatRemainingCountdown(remainingSeconds: number): string {
	const safe = Math.max(0, Math.floor(remainingSeconds));
	const hours = Math.floor(safe / 3600);
	const minutes = Math.floor((safe % 3600) / 60);
	const seconds = safe % 60;

	if (hours > 0) {
		return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
	}
	return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export function shouldAutoStop(
	elapsedSeconds: number,
	limitSeconds: number | null | undefined,
): boolean {
	if (limitSeconds === null || limitSeconds === undefined || limitSeconds <= 0) {
		return false;
	}
	return elapsedSeconds >= limitSeconds;
}
