/**
 * Tactile Mouse Click Sound Synthesizer
 * Pure local deterministic Web Audio API synthesis for mouse click sound effects.
 */

export type ClickSoundStyle = "none" | "mechanical" | "trackpad" | "soft";

export const DEFAULT_CLICK_SOUND_STYLE: ClickSoundStyle = "none";
export const DEFAULT_CLICK_SOUND_VOLUME = 0.7;

export function normalizeClickSoundStyle(
	value: unknown,
	fallback: ClickSoundStyle = DEFAULT_CLICK_SOUND_STYLE,
): ClickSoundStyle {
	if (value === "none" || value === "mechanical" || value === "trackpad" || value === "soft") {
		return value;
	}
	return fallback;
}

export function normalizeClickSoundVolume(
	value: unknown,
	fallback: number = DEFAULT_CLICK_SOUND_VOLUME,
): number {
	if (typeof value !== "number" || !Number.isFinite(value)) {
		return fallback;
	}
	return Math.max(0, Math.min(1, value));
}

/**
 * Procedurally generates an AudioBuffer containing a realistic tactile click sound.
 */
export function generateClickAudioBuffer(
	audioCtx: BaseAudioContext,
	style: Exclude<ClickSoundStyle, "none">,
): AudioBuffer {
	const sampleRate = audioCtx.sampleRate || 44100;

	if (style === "trackpad") {
		// Apple Force Touch style: solid low punch + haptic metallic transient
		const duration = 0.024;
		const length = Math.ceil(sampleRate * duration);
		const buffer = audioCtx.createBuffer(1, length, sampleRate);
		const data = buffer.getChannelData(0);

		for (let i = 0; i < length; i++) {
			const t = i / sampleRate;
			// Rapid exponential decay
			const env = Math.exp(-t * 220);
			// Haptic low-frequency body (180 Hz sweeping down)
			const body = Math.sin(2 * Math.PI * (180 - t * 1200) * t);
			// High-frequency tactile tick (1600 Hz for first 4ms)
			const tickEnv = Math.exp(-t * 1100);
			const tick = Math.sin(2 * Math.PI * 1600 * t) * tickEnv * 0.45;

			data[i] = (body * 0.65 + tick) * env;
		}
		return buffer;
	}

	if (style === "soft") {
		// Gentle low-pass muffled tap
		const duration = 0.02;
		const length = Math.ceil(sampleRate * duration);
		const buffer = audioCtx.createBuffer(1, length, sampleRate);
		const data = buffer.getChannelData(0);

		for (let i = 0; i < length; i++) {
			const t = i / sampleRate;
			const env = Math.exp(-t * 320);
			const tone = Math.sin(2 * Math.PI * 680 * t);
			data[i] = tone * env * 0.8;
		}
		return buffer;
	}

	// Mechanical switch style (crisp micro-switch with double transient)
	const duration = 0.032;
	const length = Math.ceil(sampleRate * duration);
	const buffer = audioCtx.createBuffer(1, length, sampleRate);
	const data = buffer.getChannelData(0);

	for (let i = 0; i < length; i++) {
		const t = i / sampleRate;
		// Primary click impulse at t = 0
		const env1 = Math.exp(-t * 380);
		const tone1 = Math.sin(2 * Math.PI * 2400 * t);

		// Secondary bounce/release micro-click at t = 10ms
		let secondary = 0;
		if (t > 0.01) {
			const t2 = t - 0.01;
			const env2 = Math.exp(-t2 * 450);
			secondary = Math.sin(2 * Math.PI * 3100 * t2) * env2 * 0.35;
		}

		data[i] = (tone1 * 0.7 + secondary) * env1;
	}
	return buffer;
}

/**
 * Manages tactile click sound playback during preview scrubbing and playback.
 */
export class TactileClickAudioPlayer {
	private audioCtx: AudioContext | null = null;
	private buffers: Partial<Record<Exclude<ClickSoundStyle, "none">, AudioBuffer>> = {};
	private lastPlayedTimeMs = -1;

	private getAudioContext(): AudioContext | null {
		if (typeof window === "undefined") return null;
		if (!this.audioCtx) {
			const AudioContextClass =
				window.AudioContext ||
				(window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
			if (AudioContextClass) {
				this.audioCtx = new AudioContextClass();
			}
		}
		if (this.audioCtx && this.audioCtx.state === "suspended") {
			void this.audioCtx.resume();
		}
		return this.audioCtx;
	}

	public getBuffer(style: Exclude<ClickSoundStyle, "none">): AudioBuffer | null {
		const ctx = this.getAudioContext();
		if (!ctx) return null;
		if (!this.buffers[style]) {
			this.buffers[style] = generateClickAudioBuffer(ctx, style);
		}
		return this.buffers[style] || null;
	}

	public playClick(style: ClickSoundStyle, volume = DEFAULT_CLICK_SOUND_VOLUME): void {
		if (style === "none" || volume <= 0) return;
		const ctx = this.getAudioContext();
		if (!ctx) return;

		const buffer = this.getBuffer(style);
		if (!buffer) return;

		const source = ctx.createBufferSource();
		source.buffer = buffer;

		// Subtle randomized playback rate (+/- 3%) for organic acoustic variation
		const randomPitch = 0.97 + Math.random() * 0.06;
		source.playbackRate.value = randomPitch;

		const gainNode = ctx.createGain();
		gainNode.gain.value = Math.max(0, Math.min(1, volume));

		source.connect(gainNode);
		gainNode.connect(ctx.destination);
		source.start();
	}

	/**
	 * Checks if a click occurred between lastTimeMs and currentTimeMs, and triggers sound if so.
	 */
	public checkAndPlayClicks(
		clickTimestampsMs: number[],
		currentTimeMs: number,
		style: ClickSoundStyle,
		volume: number,
		isPlaying: boolean,
	): void {
		if (style === "none" || volume <= 0 || !isPlaying || clickTimestampsMs.length === 0) {
			this.lastPlayedTimeMs = currentTimeMs;
			return;
		}

		if (this.lastPlayedTimeMs < 0 || Math.abs(currentTimeMs - this.lastPlayedTimeMs) > 500) {
			// Seeked or jumped, reset without playing backlog
			this.lastPlayedTimeMs = currentTimeMs;
			return;
		}

		const startTime = Math.min(this.lastPlayedTimeMs, currentTimeMs);
		const endTime = Math.max(this.lastPlayedTimeMs, currentTimeMs);

		for (const clickTime of clickTimestampsMs) {
			if (clickTime > startTime && clickTime <= endTime) {
				this.playClick(style, volume);
				break; // avoid multi-firing within single frame
			}
		}

		this.lastPlayedTimeMs = currentTimeMs;
	}

	public reset(): void {
		this.lastPlayedTimeMs = -1;
	}

	public destroy(): void {
		if (this.audioCtx) {
			void this.audioCtx.close();
			this.audioCtx = null;
		}
		this.buffers = {};
	}
}
