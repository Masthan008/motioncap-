import { describe, expect, it } from "vitest";
import {
	buildFfmpegAudioNormalizationFilter,
	DEFAULT_AUDIO_LIMITER_CEILING,
	DEFAULT_AUDIO_NORMALIZATION_LUFS,
	DEFAULT_AUDIO_TRUE_PEAK_DB,
	normalizeAndLimitAudioBufferInPlace,
} from "./audioLimiterNormalizer";

describe("audioLimiterNormalizer", () => {
	describe("buildFfmpegAudioNormalizationFilter", () => {
		it("builds default EBU R128 loudnorm and alimiter filter string", () => {
			const filter = buildFfmpegAudioNormalizationFilter();
			expect(filter).toContain("loudnorm=I=-16:TP=-1.5:LRA=11");
			expect(filter).toContain("alimiter=limit=0.95:level=true:attack=5:release=50");
		});

		it("allows custom LUFS and peak dB parameters", () => {
			const filter = buildFfmpegAudioNormalizationFilter({
				lufs: -14,
				truePeakDb: -1.0,
				limiterCeiling: 0.98,
			});
			expect(filter).toContain("loudnorm=I=-14:TP=-1:LRA=11");
			expect(filter).toContain("alimiter=limit=0.98:level=true:attack=5:release=50");
		});
	});

	describe("normalizeAndLimitAudioBufferInPlace", () => {
		function createMockAudioBuffer(channels: number, samples: number, fillVal = 0): AudioBuffer {
			const channelData = Array.from({ length: channels }, () => new Float32Array(samples).fill(fillVal));
			return {
				numberOfChannels: channels,
				length: samples,
				sampleRate: 48000,
				duration: samples / 48000,
				getChannelData: (ch: number) => channelData[ch],
				copyFromChannel: () => {},
				copyToChannel: () => {},
			} as unknown as AudioBuffer;
		}

		it("boosts low volume audio towards target peak", () => {
			const buffer = createMockAudioBuffer(1, 100, 0.1);
			const changed = normalizeAndLimitAudioBufferInPlace(buffer, 0.95);
			expect(changed).toBe(true);
			const data = buffer.getChannelData(0);
			// Peak was 0.1, target is 0.95 -> scaled by 4 (capped) or 9.5
			expect(data[0]).toBeGreaterThan(0.3);
			expect(data[0]).toBeLessThanOrEqual(0.985);
		});

		it("attenuates and limits clipping peaks above 1.0", () => {
			const buffer = createMockAudioBuffer(1, 100, 1.5);
			const changed = normalizeAndLimitAudioBufferInPlace(buffer, 0.95);
			expect(changed).toBe(true);
			const data = buffer.getChannelData(0);
			expect(data[0]).toBeLessThanOrEqual(0.985);
		});

		it("handles zero/silent buffer gracefully without error or NaN", () => {
			const buffer = createMockAudioBuffer(1, 100, 0);
			const changed = normalizeAndLimitAudioBufferInPlace(buffer, 0.95);
			const data = buffer.getChannelData(0);
			expect(Number.isFinite(data[0])).toBe(true);
			expect(data[0]).toBe(0);
		});
	});
});
