import { describe, expect, it } from "vitest";

import { ADVANCED_VERTICAL_PADDING_MAX } from "../types";
import { computePaddedLayout, scalePreviewBorderRadius } from "./layoutUtils";

const BASE_LAYOUT_PARAMS = {
	width: 1000,
	height: 1000,
	cropRegion: { x: 0, y: 0, width: 1, height: 1 },
	videoWidth: 1000,
	videoHeight: 1000,
};

describe("computePaddedLayout", () => {
	it("allows advanced bottom padding to pin the video to the top edge", () => {
		const layout = computePaddedLayout({
			...BASE_LAYOUT_PARAMS,
			padding: {
				top: 0,
				bottom: ADVANCED_VERTICAL_PADDING_MAX,
				left: 0,
				right: 0,
				linked: false,
			},
		});

		expect(layout.centerOffsetY).toBeCloseTo(0);
	});

	it("allows advanced top padding to pin the video to the bottom edge", () => {
		const layout = computePaddedLayout({
			...BASE_LAYOUT_PARAMS,
			padding: {
				top: ADVANCED_VERTICAL_PADDING_MAX,
				bottom: 0,
				left: 0,
				right: 0,
				linked: false,
			},
		});

		expect(layout.centerOffsetY + layout.croppedDisplayHeight).toBeCloseTo(
			BASE_LAYOUT_PARAMS.height,
		);
	});

	it("preserves linked padding centering behavior", () => {
		const layout = computePaddedLayout({
			...BASE_LAYOUT_PARAMS,
			padding: { top: 20, bottom: 20, left: 20, right: 20, linked: true },
		});

		expect(layout.centerOffsetY).toBeCloseTo(40);
		expect(layout.centerOffsetY + layout.croppedDisplayHeight).toBeCloseTo(960);
	});

	it("covers vertical height and pans horizontally when autoReframe916 is active", () => {
		const verticalParams = {
			width: 1080,
			height: 1920,
			cropRegion: { x: 0, y: 0, width: 1, height: 1 },
			videoWidth: 1920,
			videoHeight: 1080,
			padding: 0,
		};

		// Without autoReframe916: letterboxed (fits width)
		const letterboxLayout = computePaddedLayout({
			...verticalParams,
			autoReframe916: false,
		});
		expect(letterboxLayout.scale).toBeCloseTo(1080 / 1920, 4);
		expect(letterboxLayout.croppedDisplayHeight).toBeCloseTo((1080 / 1920) * 1080, 2);

		// With autoReframe916: fills height (cover)
		const reframedLayoutCenter = computePaddedLayout({
			...verticalParams,
			autoReframe916: true,
			panFocusX: 0.5,
		});
		expect(reframedLayoutCenter.scale).toBeCloseTo(1920 / 1080, 4);
		expect(reframedLayoutCenter.croppedDisplayHeight).toBeCloseTo(1920, 2);
		expect(reframedLayoutCenter.croppedDisplayWidth).toBeCloseTo(1080, 2);

		// Left edge focus
		const reframedLayoutLeft = computePaddedLayout({
			...verticalParams,
			autoReframe916: true,
			panFocusX: 0.0,
		});
		expect(reframedLayoutLeft.frameRect.x).toBeCloseTo(0, 1);
		expect(reframedLayoutLeft.effectiveCrop.x).toBeCloseTo(0, 2);
		expect(reframedLayoutLeft.effectiveCrop.width).toBeCloseTo(1080 / ((1920 / 1080) * 1920), 2);

		// Right edge focus
		const reframedLayoutRight = computePaddedLayout({
			...verticalParams,
			autoReframe916: true,
			panFocusX: 1.0,
		});
		const expectedRightEdge = 1080 - (1920 / 1080) * 1920;
		expect(reframedLayoutRight.frameRect.x).toBeCloseTo(expectedRightEdge, 1);
		expect(reframedLayoutRight.effectiveCrop.x + reframedLayoutRight.effectiveCrop.width).toBeCloseTo(1, 2);
	});
});

describe("scalePreviewBorderRadius", () => {
	it("uses a percentage of the content's shorter side", () => {
		expect(scalePreviewBorderRadius(1920, 1080, 8)).toBeCloseTo(86.4, 6);
		expect(scalePreviewBorderRadius(960, 540, 8)).toBeCloseTo(43.2, 6);
		expect(scalePreviewBorderRadius(500, 1000, 8)).toBeCloseTo(40, 6);
	});

	it("clamps invalid or empty preview sizes to zero", () => {
		expect(scalePreviewBorderRadius(0, 540, 16)).toBe(0);
		expect(scalePreviewBorderRadius(960, 0, 16)).toBe(0);
		expect(scalePreviewBorderRadius(960, 540, -8)).toBe(0);
	});
});
