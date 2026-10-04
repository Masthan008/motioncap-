import { describe, expect, it } from "vitest";
import {
	DEFAULT_CLICK_SOUND_STYLE,
	DEFAULT_CLICK_SOUND_VOLUME,
	generateClickAudioBuffer,
	normalizeClickSoundStyle,
	normalizeClickSoundVolume,
	TactileClickAudioPlayer,
} from "./tactileClickSound";

describe("tactileClickSound", () => {
	it("normalizes click sound style properly", () => {
		expect(normalizeClickSoundStyle("mechanical")).toBe("mechanical");
		expect(normalizeClickSoundStyle("trackpad")).toBe("trackpad");
		expect(normalizeClickSoundStyle("soft")).toBe("soft");
		expect(normalizeClickSoundStyle("none")).toBe("none");
		expect(normalizeClickSoundStyle("invalid")).toBe(DEFAULT_CLICK_SOUND_STYLE);
		expect(normalizeClickSoundStyle(null)).toBe(DEFAULT_CLICK_SOUND_STYLE);
	});

	it("normalizes click sound volume properly", () => {
		expect(normalizeClickSoundVolume(0.5)).toBe(0.5);
		expect(normalizeClickSoundVolume(-0.2)).toBe(0);
		expect(normalizeClickSoundVolume(1.5)).toBe(1);
		expect(normalizeClickSoundVolume("bad")).toBe(DEFAULT_CLICK_SOUND_VOLUME);
	});

	it("generates audio buffers for mechanical, trackpad, and soft styles", () => {
		// Mock a minimal BaseAudioContext
		const mockAudioCtx = {
			sampleRate: 44100,
			createBuffer: (channels: number, length: number, sampleRate: number) => {
				const channelData = new Float32Array(length);
				return {
					numberOfChannels: channels,
					length,
					sampleRate,
					duration: length / sampleRate,
					getChannelData: () => channelData,
				};
			},
		} as unknown as BaseAudioContext;

		const mechBuf = generateClickAudioBuffer(mockAudioCtx, "mechanical");
		expect(mechBuf.length).toBeGreaterThan(0);
		expect(mechBuf.sampleRate).toBe(44100);

		const trackpadBuf = generateClickAudioBuffer(mockAudioCtx, "trackpad");
		expect(trackpadBuf.length).toBeGreaterThan(0);

		const softBuf = generateClickAudioBuffer(mockAudioCtx, "soft");
		expect(softBuf.length).toBeGreaterThan(0);
	});

	it("checks and schedules clicks correctly across playback interval", () => {
		const player = new TactileClickAudioPlayer();
		let played = 0;
		player.playClick = () => {
			played++;
		};

		const clickTimestamps = [500, 1200, 2500];

		// Initial frame
		player.checkAndPlayClicks(clickTimestamps, 400, "trackpad", 0.7, true);
		expect(played).toBe(0);

		// Frame advancing from 400 to 550 (passes click at 500)
		player.checkAndPlayClicks(clickTimestamps, 550, "trackpad", 0.7, true);
		expect(played).toBe(1);

		// Frame advancing from 550 to 600 (no click)
		player.checkAndPlayClicks(clickTimestamps, 600, "trackpad", 0.7, true);
		expect(played).toBe(1);

		// Large seek jump (> 500ms) should not trigger click
		player.checkAndPlayClicks(clickTimestamps, 2450, "trackpad", 0.7, true);
		expect(played).toBe(1);

		// Next frame advancing from 2450 to 2550 (passes click at 2500)
		player.checkAndPlayClicks(clickTimestamps, 2550, "trackpad", 0.7, true);
		expect(played).toBe(2);

		player.destroy();
	});
});
