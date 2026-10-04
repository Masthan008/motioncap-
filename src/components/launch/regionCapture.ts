import type { CropRegion } from "../video-editor/types";

export interface MarqueeRegion {
	x: number;
	y: number;
	width: number;
	height: number;
	screenWidth: number;
	screenHeight: number;
}

export interface RegionPreset {
	id: string;
	label: string;
	width: number;
	height: number;
}

export const REGION_PRESETS: RegionPreset[] = [
	{ id: "1080p", label: "Full HD (1920×1080)", width: 1920, height: 1080 },
	{ id: "720p", label: "HD (1280×720)", width: 1280, height: 720 },
	{ id: "square", label: "1:1 Square (1080×1080)", width: 1080, height: 1080 },
	{ id: "vertical", label: "9:16 Reel (1080×1920)", width: 1080, height: 1920 },
	{ id: "4_3", label: "4:3 Standard (1440×1080)", width: 1440, height: 1080 },
	{ id: "custom", label: "Custom Freeform", width: 0, height: 0 },
];

export const ACTIVE_CAPTURE_REGION_KEY = "motioncap.active-capture-region";
export const SESSION_RECORDING_CROP_KEY = "motioncap.session-recording-crop";

/**
 * Persist the active marquee region chosen in the launcher.
 */
export function saveActiveCaptureRegion(region: MarqueeRegion | null): void {
	try {
		if (typeof globalThis.localStorage === "undefined") return;
		if (!region) {
			globalThis.localStorage.removeItem(ACTIVE_CAPTURE_REGION_KEY);
			return;
		}
		globalThis.localStorage.setItem(ACTIVE_CAPTURE_REGION_KEY, JSON.stringify(region));
	} catch (error) {
		console.warn("Failed to save active capture region:", error);
	}
}

/**
 * Load the active marquee region chosen in the launcher.
 */
export function loadActiveCaptureRegion(): MarqueeRegion | null {
	try {
		if (typeof globalThis.localStorage === "undefined") return null;
		const raw = globalThis.localStorage.getItem(ACTIVE_CAPTURE_REGION_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw) as Partial<MarqueeRegion>;
		if (
			typeof parsed.x === "number" &&
			typeof parsed.y === "number" &&
			typeof parsed.width === "number" &&
			typeof parsed.height === "number" &&
			parsed.width > 0 &&
			parsed.height > 0
		) {
			return {
				x: Math.max(0, parsed.x),
				y: Math.max(0, parsed.y),
				width: parsed.width,
				height: parsed.height,
				screenWidth: parsed.screenWidth ?? 1920,
				screenHeight: parsed.screenHeight ?? 1080,
			};
		}
		return null;
	} catch {
		return null;
	}
}

/**
 * Clear the active marquee region.
 */
export function clearActiveCaptureRegion(): void {
	try {
		if (typeof globalThis.localStorage === "undefined") return;
		globalThis.localStorage.removeItem(ACTIVE_CAPTURE_REGION_KEY);
	} catch {
		// Ignore storage error
	}
}

/**
 * Persist the normalized crop region for the next editor session.
 */
export function setSessionCropRegion(crop: CropRegion | null): void {
	try {
		const storage = globalThis.sessionStorage || globalThis.localStorage;
		if (!storage) return;
		if (!crop) {
			storage.removeItem(SESSION_RECORDING_CROP_KEY);
			return;
		}
		storage.setItem(SESSION_RECORDING_CROP_KEY, JSON.stringify(crop));
	} catch (error) {
		console.warn("Failed to set session crop region:", error);
	}
}

/**
 * Read the session recording crop region.
 */
export function getSessionCropRegion(): CropRegion | null {
	try {
		const storage = globalThis.sessionStorage || globalThis.localStorage;
		if (!storage) return null;
		const raw = storage.getItem(SESSION_RECORDING_CROP_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw) as Partial<CropRegion>;
		if (
			typeof parsed.x === "number" &&
			typeof parsed.y === "number" &&
			typeof parsed.width === "number" &&
			typeof parsed.height === "number" &&
			parsed.width > 0 &&
			parsed.height > 0
		) {
			return {
				x: Math.min(1, Math.max(0, parsed.x)),
				y: Math.min(1, Math.max(0, parsed.y)),
				width: Math.min(1, Math.max(0.01, parsed.width)),
				height: Math.min(1, Math.max(0.01, parsed.height)),
			};
		}
		return null;
	} catch {
		return null;
	}
}

/**
 * Consume (read and remove) the session recording crop region so it is applied once.
 */
export function consumeSessionCropRegion(): CropRegion | null {
	const crop = getSessionCropRegion();
	if (crop) {
		setSessionCropRegion(null);
	}
	return crop;
}

/**
 * Convert pixel MarqueeRegion into a normalized 0-1 CropRegion.
 */
export function normalizeRegionToCrop(region: MarqueeRegion): CropRegion {
	const screenW = Math.max(1, region.screenWidth);
	const screenH = Math.max(1, region.screenHeight);

	const clampedX = Math.max(0, Math.min(screenW - 10, region.x));
	const clampedY = Math.max(0, Math.min(screenH - 10, region.y));
	const clampedW = Math.max(10, Math.min(screenW - clampedX, region.width));
	const clampedH = Math.max(10, Math.min(screenH - clampedY, region.height));

	return {
		x: clampedX / screenW,
		y: clampedY / screenH,
		width: clampedW / screenW,
		height: clampedH / screenH,
	};
}

/**
 * Convert normalized 0-1 CropRegion into pixel MarqueeRegion.
 */
export function denormalizeCropToRegion(
	crop: CropRegion,
	screenWidth: number,
	screenHeight: number,
): MarqueeRegion {
	return {
		x: Math.round(crop.x * screenWidth),
		y: Math.round(crop.y * screenHeight),
		width: Math.round(crop.width * screenWidth),
		height: Math.round(crop.height * screenHeight),
		screenWidth,
		screenHeight,
	};
}

/**
 * Clamp a MarqueeRegion within the display bounds.
 */
export function clampRegionToBounds(
	region: MarqueeRegion,
	screenWidth: number,
	screenHeight: number,
): MarqueeRegion {
	const minSize = 40;
	const width = Math.max(minSize, Math.min(screenWidth, region.width));
	const height = Math.max(minSize, Math.min(screenHeight, region.height));
	const x = Math.max(0, Math.min(screenWidth - width, region.x));
	const y = Math.max(0, Math.min(screenHeight - height, region.y));

	return {
		x,
		y,
		width,
		height,
		screenWidth,
		screenHeight,
	};
}

/**
 * Generate a centered MarqueeRegion from a preset for the given display resolution.
 */
export function createPresetRegion(
	presetId: string,
	screenWidth: number,
	screenHeight: number,
): MarqueeRegion {
	const preset = REGION_PRESETS.find((p) => p.id === presetId);
	if (!preset || preset.width === 0 || preset.height === 0) {
		// Custom / default to 75% centered box
		const w = Math.round(screenWidth * 0.75);
		const h = Math.round(screenHeight * 0.75);
		return {
			x: Math.round((screenWidth - w) / 2),
			y: Math.round((screenHeight - h) / 2),
			width: w,
			height: h,
			screenWidth,
			screenHeight,
		};
	}

	let targetW = preset.width;
	let targetH = preset.height;

	// Scale down if preset exceeds screen resolution (maintaining aspect ratio)
	const maxW = screenWidth * 0.9;
	const maxH = screenHeight * 0.9;
	if (targetW > maxW || targetH > maxH) {
		const scale = Math.min(maxW / targetW, maxH / targetH);
		targetW = Math.round(targetW * scale);
		targetH = Math.round(targetH * scale);
	}

	const x = Math.round((screenWidth - targetW) / 2);
	const y = Math.round((screenHeight - targetH) / 2);

	return {
		x,
		y,
		width: targetW,
		height: targetH,
		screenWidth,
		screenHeight,
	};
}
