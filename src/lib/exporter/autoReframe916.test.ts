import { describe, expect, it } from "vitest";
import { computeAutoReframeFocus, createCursorFollowCameraState } from "@/components/video-editor/videoPlayback/cursorFollowCamera";
import { computePaddedLayout } from "@/components/video-editor/videoPlayback/layoutUtils";
import { buildExportRenderOptions } from "@/components/video-editor/export/buildExportRenderOptions";

describe("Phase 3 - Feature 3: Dynamic 9:16 Social Auto-Reframing", () => {
	it("computes safe-zone cursor-follow focus smoothly across frames", () => {
		const state = createCursorFollowCameraState();
		const telemetry = [
			{ timeMs: 0, cx: 0.1, cy: 0.2, interactionType: "move" as const },
			{ timeMs: 1000, cx: 0.9, cy: 0.5, interactionType: "move" as const },
		];

		// Frame at start
		const focusStart = computeAutoReframeFocus(state, telemetry, 0);
		expect(focusStart.cx).toBeCloseTo(0.1, 2);

		// Frame at 500ms (interpolated cursor cx = 0.5)
		const focusMid = computeAutoReframeFocus(state, telemetry, 500);
		expect(focusMid.cx).toBeGreaterThanOrEqual(0.1);
		expect(focusMid.cx).toBeLessThanOrEqual(0.9);

		// Frame at 1000ms
		const focusEnd = computeAutoReframeFocus(state, telemetry, 1000);
		expect(focusEnd.cx).toBeGreaterThan(0.5);
	});

	it("computes 9:16 cover scale and panned horizontal sprite offset with effectiveCrop", () => {
		const width = 1080;
		const height = 1920;
		const videoWidth = 1920;
		const videoHeight = 1080;

		// Center focus
		const centerLayout = computePaddedLayout({
			width,
			height,
			padding: 0,
			cropRegion: { x: 0, y: 0, width: 1, height: 1 },
			videoWidth,
			videoHeight,
			autoReframe916: true,
			panFocusX: 0.5,
		});

		expect(centerLayout.scale).toBeCloseTo(1920 / 1080, 4);
		expect(centerLayout.croppedDisplayHeight).toBeCloseTo(1920, 2);
		expect(centerLayout.croppedDisplayWidth).toBeCloseTo(1080, 2);
		expect(centerLayout.effectiveCrop.width).toBeLessThan(1);
		expect(centerLayout.effectiveCrop.x).toBeGreaterThan(0);

		// Left edge focus
		const leftLayout = computePaddedLayout({
			width,
			height,
			padding: 0,
			cropRegion: { x: 0, y: 0, width: 1, height: 1 },
			videoWidth,
			videoHeight,
			autoReframe916: true,
			panFocusX: 0.0,
		});
		expect(leftLayout.frameRect.x).toBeCloseTo(0, 1);
		expect(leftLayout.effectiveCrop.x).toBeCloseTo(0, 2);

		// Right edge focus
		const rightLayout = computePaddedLayout({
			width,
			height,
			padding: 0,
			cropRegion: { x: 0, y: 0, width: 1, height: 1 },
			videoWidth,
			videoHeight,
			autoReframe916: true,
			panFocusX: 1.0,
		});
		expect(rightLayout.effectiveCrop.x + rightLayout.effectiveCrop.width).toBeCloseTo(1, 2);
	});

	it("forwards autoReframe916 in buildExportRenderOptions", () => {
		const options = buildExportRenderOptions({
			appearance: {
				wallpaper: "linear-gradient(to right, #000, #fff)",
				borderRadius: 8,
				padding: 0,
				cropRegion: { x: 0, y: 0, width: 1, height: 1 },
				autoReframe916: true,
				backgroundBlur: 0,
				zoomMotionBlur: 0,
				zoomMotionBlurTuning: undefined,
				connectZooms: true,
				zoomInDurationMs: 400,
				zoomInOverlapMs: 150,
				zoomOutDurationMs: 400,
				connectedZoomGapMs: 100,
				connectedZoomDurationMs: 300,
				zoomInEasing: "ease-out" as const,
				zoomOutEasing: "ease-in" as const,
				connectedZoomEasing: "ease-in-out" as const,
				webcam: { enabled: false } as never,
				resolvedWebcamVideoUrl: null,
				cursorStyle: "default" as const,
				cursorSize: 1,
				cursorSmoothing: 0.5,
				cursorSpringStiffnessMultiplier: 1,
				cursorSpringDampingMultiplier: 1,
				cursorSpringMassMultiplier: 1,
				cameraSpringStiffnessMultiplier: 1,
				cameraSpringDampingMultiplier: 1,
				cameraSpringMassMultiplier: 1,
				zoomSmoothness: 0.5,
				zoomClassicMode: false,
				cursorMotionBlur: 0,
				cursorClickEffect: "none" as const,
				cursorClickEffectColor: "#fff",
				cursorClickEffectScale: 1,
				cursorClickEffectOpacity: 1,
				cursorClickEffectDurationMs: 300,
				cursorClickBounce: 1,
				cursorClickBounceDuration: 200,
				cursorSway: 0,
			} as never,
			timeline: {
				clipRegions: [],
				trimRegions: [],
				annotationRegions: [],
				autoCaptions: [],
				autoCaptionSettings: undefined,
			} as never,
			effectiveSpeedRegions: [],
			effectiveZoomRegions: [],
			effectiveCursorTelemetry: [],
			effectiveShowCursor: true,
			previewWidth: 1080,
			previewHeight: 1920,
			shadowIntensity: 0,
			onProgress: () => {},
		});

		expect(options.autoReframe916).toBe(true);
	});
});
