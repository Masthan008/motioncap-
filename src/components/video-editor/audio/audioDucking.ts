export interface SpeechInterval {
	startMs: number;
	endMs: number;
}

export const DEFAULT_DUCKING_AMOUNT = 0.25; // Attenuates to 25% volume (-12 dB)
export const DEFAULT_DUCKING_ATTACK_MS = 100; // 100ms attack
export const DEFAULT_DUCKING_RELEASE_MS = 400; // 400ms release
export const DEFAULT_SPEECH_THRESHOLD_PEAK = 0.07; // Normalized peak amplitude threshold
export const DEFAULT_BRIDGE_PAUSE_MS = 350; // Bridge brief pauses between words (<350ms)
export const MIN_SPEECH_DURATION_MS = 150; // Ignore tiny clicks <150ms as speech

/**
 * Detects speech intervals from normalized waveform peaks (0.0 - 1.0).
 */
export function detectSpeechIntervalsFromPeaks(
	peaks: Float32Array | number[],
	durationMs: number,
	threshold = DEFAULT_SPEECH_THRESHOLD_PEAK,
	minSpeechDurationMs = MIN_SPEECH_DURATION_MS,
	bridgePauseMs = DEFAULT_BRIDGE_PAUSE_MS,
): SpeechInterval[] {
	if (!peaks || peaks.length === 0 || durationMs <= 0) {
		return [];
	}

	const rawIntervals: SpeechInterval[] = [];
	const msPerPeak = durationMs / peaks.length;
	let inSpeech = false;
	let speechStartMs = 0;

	for (let i = 0; i < peaks.length; i++) {
		const isAbove = peaks[i] >= threshold;
		const currentMs = i * msPerPeak;

		if (isAbove && !inSpeech) {
			inSpeech = true;
			speechStartMs = currentMs;
		} else if (!isAbove && inSpeech) {
			inSpeech = false;
			const speechEndMs = currentMs;
			if (speechEndMs - speechStartMs >= minSpeechDurationMs) {
				rawIntervals.push({
					startMs: Math.round(speechStartMs),
					endMs: Math.round(speechEndMs),
				});
			}
		}
	}

	if (inSpeech) {
		const speechEndMs = durationMs;
		if (speechEndMs - speechStartMs >= minSpeechDurationMs) {
			rawIntervals.push({
				startMs: Math.round(speechStartMs),
				endMs: Math.round(speechEndMs),
			});
		}
	}

	return bridgeSpeechIntervals(rawIntervals, bridgePauseMs);
}

/**
 * Detects speech intervals from an AudioBuffer using RMS energy analysis.
 */
export function detectSpeechIntervalsFromAudioBuffer(
	buffer: AudioBuffer,
	thresholdDb = -26,
	windowMs = 50,
	bridgePauseMs = DEFAULT_BRIDGE_PAUSE_MS,
): SpeechInterval[] {
	if (!buffer || buffer.length === 0) {
		return [];
	}

	const sampleRate = buffer.sampleRate;
	const windowSamples = Math.max(1, Math.floor((sampleRate * windowMs) / 1000));
	const numChannels = buffer.numberOfChannels;
	const channelData: Float32Array[] = [];
	for (let c = 0; c < numChannels; c++) {
		channelData.push(buffer.getChannelData(c));
	}

	const thresholdLinear = Math.pow(10, thresholdDb / 20);
	const totalWindows = Math.ceil(buffer.length / windowSamples);
	const peaks = new Float32Array(totalWindows);

	for (let w = 0; w < totalWindows; w++) {
		const startSample = w * windowSamples;
		const endSample = Math.min(buffer.length, startSample + windowSamples);
		let sumSquares = 0;
		let count = 0;

		for (let i = startSample; i < endSample; i++) {
			for (let c = 0; c < numChannels; c++) {
				const val = channelData[c][i];
				sumSquares += val * val;
				count++;
			}
		}

		const rms = count > 0 ? Math.sqrt(sumSquares / count) : 0;
		peaks[w] = rms;
	}

	return detectSpeechIntervalsFromPeaks(
		peaks,
		buffer.duration * 1000,
		thresholdLinear,
		MIN_SPEECH_DURATION_MS,
		bridgePauseMs,
	);
}

/**
 * Bridges intervals separated by brief pauses (< bridgePauseMs) and sorts them.
 */
export function bridgeSpeechIntervals(
	intervals: SpeechInterval[],
	bridgePauseMs = DEFAULT_BRIDGE_PAUSE_MS,
): SpeechInterval[] {
	if (intervals.length <= 1) return [...intervals];

	const sorted = [...intervals].sort((a, b) => a.startMs - b.startMs);
	const merged: SpeechInterval[] = [sorted[0]];

	for (let i = 1; i < sorted.length; i++) {
		const current = sorted[i];
		const prev = merged[merged.length - 1];

		if (current.startMs <= prev.endMs + bridgePauseMs) {
			prev.endMs = Math.max(prev.endMs, current.endMs);
		} else {
			merged.push({ ...current });
		}
	}

	return merged;
}

/**
 * Merges two or more speech interval sources (e.g. mic peaks + caption cues).
 */
export function mergeSpeechIntervals(...intervalGroups: SpeechInterval[][]): SpeechInterval[] {
	const all: SpeechInterval[] = [];
	for (const group of intervalGroups) {
		if (group) all.push(...group);
	}
	return bridgeSpeechIntervals(all, DEFAULT_BRIDGE_PAUSE_MS);
}

/**
 * Computes instantaneous ducking gain (duckingAmount .. 1.0) at any point in time.
 * Uses smooth cosine S-curve interpolation for click-free attack and release.
 */
export function computeDuckingGainAtTime(
	timeMs: number,
	intervals: SpeechInterval[],
	duckingAmount = DEFAULT_DUCKING_AMOUNT,
	attackMs = DEFAULT_DUCKING_ATTACK_MS,
	releaseMs = DEFAULT_DUCKING_RELEASE_MS,
): number {
	if (!intervals || intervals.length === 0) {
		return 1.0;
	}

	const clampedAmount = Math.max(0, Math.min(1, duckingAmount));

	// Binary search or linear search for active or neighboring interval
	for (let i = 0; i < intervals.length; i++) {
		const interval = intervals[i];

		// Check if we are inside speech
		if (timeMs >= interval.startMs && timeMs <= interval.endMs) {
			return clampedAmount;
		}

		// Check if in attack ramp
		if (attackMs > 0 && timeMs >= interval.startMs - attackMs && timeMs < interval.startMs) {
			const progress = (timeMs - (interval.startMs - attackMs)) / attackMs; // 0 at ramp start, 1 at speech start
			const smooth = 0.5 * (1 - Math.cos(Math.PI * progress)); // S-curve 0 -> 1
			return 1.0 - (1.0 - clampedAmount) * smooth;
		}

		// Check if in release ramp
		if (releaseMs > 0 && timeMs > interval.endMs && timeMs <= interval.endMs + releaseMs) {
			// Check if another speech interval starts before this release finishes
			const nextInterval = intervals[i + 1];
			if (nextInterval && timeMs >= nextInterval.startMs - attackMs) {
				// Don't release if already in the attack of the next speech
				return clampedAmount;
			}

			const progress = (timeMs - interval.endMs) / releaseMs; // 0 at speech end, 1 at release end
			const smooth = 0.5 * (1 - Math.cos(Math.PI * progress)); // S-curve 0 -> 1
			return clampedAmount + (1.0 - clampedAmount) * smooth;
		}
	}

	return 1.0;
}

/**
 * Builds a discrete gain envelope array over a duration for offline audio rendering.
 */
export function buildDuckingGainEnvelope(
	durationMs: number,
	intervals: SpeechInterval[],
	duckingAmount = DEFAULT_DUCKING_AMOUNT,
	attackMs = DEFAULT_DUCKING_ATTACK_MS,
	releaseMs = DEFAULT_DUCKING_RELEASE_MS,
	pointsCount = 500,
): Float32Array {
	const count = Math.max(2, pointsCount);
	const envelope = new Float32Array(count);
	const stepMs = durationMs / (count - 1);

	for (let i = 0; i < count; i++) {
		const t = i * stepMs;
		envelope[i] = computeDuckingGainAtTime(
			t,
			intervals,
			duckingAmount,
			attackMs,
			releaseMs,
		);
	}

	return envelope;
}
