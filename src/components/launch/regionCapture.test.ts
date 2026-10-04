import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import {
	clampRegionToBounds,
	clearActiveCaptureRegion,
	consumeSessionCropRegion,
	createPresetRegion,
	denormalizeCropToRegion,
	getSessionCropRegion,
	loadActiveCaptureRegion,
	normalizeRegionToCrop,
	saveActiveCaptureRegion,
	setSessionCropRegion,
	type MarqueeRegion,
} from "./regionCapture";

function createStorageMock(initialValues: Record<string, string> = {}): Storage {
	const store = new Map(Object.entries(initialValues));

	return {
		get length() {
			return store.size;
		},
		clear() {
			store.clear();
		},
		getItem(key: string) {
			return store.get(key) ?? null;
		},
		key(index: number) {
			return Array.from(store.keys())[index] ?? null;
		},
		removeItem(key: string) {
			store.delete(key);
		},
		setItem(key: string, value: string) {
			store.set(key, String(value));
		},
	};
}

describe("regionCapture", () => {
	let localMock: Storage;
	let sessionMock: Storage;

	beforeEach(() => {
		localMock = createStorageMock();
		sessionMock = createStorageMock();
		vi.stubGlobal("localStorage", localMock);
		vi.stubGlobal("sessionStorage", sessionMock);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("normalizes a marquee region into a 0-1 CropRegion", () => {
		const region: MarqueeRegion = {
			x: 192,
			y: 108,
			width: 1536,
			height: 864,
			screenWidth: 1920,
			screenHeight: 1080,
		};
		const crop = normalizeRegionToCrop(region);
		expect(crop.x).toBeCloseTo(0.1, 5);
		expect(crop.y).toBeCloseTo(0.1, 5);
		expect(crop.width).toBeCloseTo(0.8, 5);
		expect(crop.height).toBeCloseTo(0.8, 5);
	});

	it("denormalizes a CropRegion back into a pixel MarqueeRegion", () => {
		const crop = { x: 0.25, y: 0.25, width: 0.5, height: 0.5 };
		const region = denormalizeCropToRegion(crop, 1920, 1080);
		expect(region).toEqual({
			x: 480,
			y: 270,
			width: 960,
			height: 540,
			screenWidth: 1920,
			screenHeight: 1080,
		});
	});

	it("clamps marquee region within screen bounds", () => {
		const outOfBounds: MarqueeRegion = {
			x: 2000,
			y: 1200,
			width: 500,
			height: 400,
			screenWidth: 1920,
			screenHeight: 1080,
		};
		const clamped = clampRegionToBounds(outOfBounds, 1920, 1080);
		expect(clamped.x + clamped.width).toBeLessThanOrEqual(1920);
		expect(clamped.y + clamped.height).toBeLessThanOrEqual(1080);
	});

	it("creates centered preset regions with aspect ratio scaling", () => {
		const preset1080 = createPresetRegion("1080p", 2560, 1440);
		expect(preset1080.width).toBe(1920);
		expect(preset1080.height).toBe(1080);
		expect(preset1080.x).toBe((2560 - 1920) / 2);
		expect(preset1080.y).toBe((1440 - 1080) / 2);

		// When preset exceeds screen, it scales down proportionally
		const smallScreenPreset = createPresetRegion("1080p", 1366, 768);
		expect(smallScreenPreset.width).toBeLessThanOrEqual(1366);
		expect(smallScreenPreset.height).toBeLessThanOrEqual(768);
		expect(smallScreenPreset.x).toBeGreaterThanOrEqual(0);
		expect(smallScreenPreset.y).toBeGreaterThanOrEqual(0);
	});

	it("saves, loads, and clears active capture region in storage", () => {
		expect(loadActiveCaptureRegion()).toBeNull();

		const region: MarqueeRegion = {
			x: 100,
			y: 100,
			width: 800,
			height: 600,
			screenWidth: 1920,
			screenHeight: 1080,
		};
		saveActiveCaptureRegion(region);
		expect(loadActiveCaptureRegion()).toEqual(region);

		clearActiveCaptureRegion();
		expect(loadActiveCaptureRegion()).toBeNull();
	});

	it("persists and consumes session crop region once", () => {
		expect(getSessionCropRegion()).toBeNull();
		const crop = { x: 0.1, y: 0.2, width: 0.6, height: 0.7 };
		setSessionCropRegion(crop);
		expect(getSessionCropRegion()).toEqual(crop);

		const consumed = consumeSessionCropRegion();
		expect(consumed).toEqual(crop);
		expect(getSessionCropRegion()).toBeNull();
	});
});
