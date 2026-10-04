import { softLimitOfflineMixPeaksInPlace } from "./audioProcessorShared";

export const DEFAULT_AUDIO_NORMALIZATION_LUFS = -16;
export const DEFAULT_AUDIO_TRUE_PEAK_DB = -1.5;
export const DEFAULT_AUDIO_LIMITER_CEILING = 0.95;

export interface AudioNormalizationFilterOptions {
	lufs?: number;
	truePeakDb?: number;
	limiterCeiling?: number;
}

/**
 * Builds the FFmpeg audio filter string for EBU R128 loudness normalization
 * followed by a true-peak brickwall audio limiter to prevent inter-sample clipping.
 */
export function buildFfmpegAudioNormalizationFilter(
	options: AudioNormalizationFilterOptions = {},
): string {
	const lufs = options.lufs ?? DEFAULT_AUDIO_NORMALIZATION_LUFS;
	const truePeakDb = options.truePeakDb ?? DEFAULT_AUDIO_TRUE_PEAK_DB;
	const limiterCeiling = options.limiterCeiling ?? DEFAULT_AUDIO_LIMITER_CEILING;

	return `loudnorm=I=${lufs}:TP=${truePeakDb}:LRA=11,alimiter=limit=${limiterCeiling}:level=true:attack=5:release=50`;
}

/**
 * Normalizes and brickwall limits an AudioBuffer in-place.
 * Balances peak level to target peak headroom while soft-limiting transients
 * to guarantee no clipping occurs in exported audio.
 */
export function normalizeAndLimitAudioBufferInPlace(
	buffer: AudioBuffer,
	targetPeak = DEFAULT_AUDIO_LIMITER_CEILING,
): boolean {
	let maxPeak = 0;
	const numChannels = buffer.numberOfChannels;

	for (let ch = 0; ch < numChannels; ch++) {
		const data = buffer.getChannelData(ch);
		for (let i = 0; i < data.length; i++) {
			const absVal = Math.abs(data[i]);
			if (absVal > maxPeak && Number.isFinite(absVal)) {
				maxPeak = absVal;
			}
		}
	}

	let changed = false;

	// Scale towards target peak (max boost of +12dB / 4x factor to avoid extreme noise amplification)
	if (maxPeak > 0.001) {
		const scaleFactor = Math.min(targetPeak / maxPeak, 4.0);
		if (Math.abs(scaleFactor - 1.0) > 0.01) {
			for (let ch = 0; ch < numChannels; ch++) {
				const data = buffer.getChannelData(ch);
				for (let i = 0; i < data.length; i++) {
					data[i] *= scaleFactor;
				}
			}
			changed = true;
		}
	}

	// Always apply soft limiter ceiling to eliminate inter-sample overshoots
	const limiterApplied = softLimitOfflineMixPeaksInPlace(buffer);
	return changed || limiterApplied;
}
