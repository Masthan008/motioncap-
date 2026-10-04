import { describe, expect, it, vi } from "vitest";
import {
	renderAnnotations,
	renderAnnotationToCanvas,
	preloadAnnotationAssets,
} from "./annotationRenderer";
import type { AnnotationRegion } from "@/components/video-editor/types";
import {
	DEFAULT_ANNOTATION_POSITION,
	DEFAULT_ANNOTATION_SIZE,
	DEFAULT_ANNOTATION_STYLE,
	DEFAULT_FIGURE_DATA,
	DEFAULT_STEP_BADGE_DATA,
	DEFAULT_HIGHLIGHTER_DATA,
	DEFAULT_SHAPE_DATA,
	getCircledNumber,
	formatStepBadgeDisplay,
} from "@/components/video-editor/types";

function createMockCanvasContext() {
	return {
		canvas: { width: 1920, height: 1080 },
		save: vi.fn(),
		restore: vi.fn(),
		beginPath: vi.fn(),
		rect: vi.fn(),
		roundRect: vi.fn(),
		clip: vi.fn(),
		arc: vi.fn(),
		ellipse: vi.fn(),
		stroke: vi.fn(),
		fill: vi.fn(),
		fillText: vi.fn(),
		measureText: vi.fn((text: string) => ({ width: text.length * 10 })),
		setLineDash: vi.fn(),
		translate: vi.fn(),
		moveTo: vi.fn(),
		lineTo: vi.fn(),
		drawImage: vi.fn(),
		fillStyle: "",
		strokeStyle: "",
		lineWidth: 1,
		lineCap: "butt",
		lineJoin: "miter",
		font: "",
		textAlign: "left",
		textBaseline: "alphabetic",
		globalAlpha: 1,
		shadowColor: "",
		shadowBlur: 0,
		shadowOffsetX: 0,
		shadowOffsetY: 0,
		filter: "none",
	} as unknown as CanvasRenderingContext2D;
}

const BASE_REGION: AnnotationRegion = {
	id: "ann-1",
	startMs: 0,
	endMs: 5000,
	type: "text",
	content: "Hello",
	position: { ...DEFAULT_ANNOTATION_POSITION },
	size: { ...DEFAULT_ANNOTATION_SIZE },
	style: { ...DEFAULT_ANNOTATION_STYLE },
	zIndex: 1,
};

describe("annotationRenderer", () => {
	it("converts numbers to circled Unicode glyphs correctly", () => {
		expect(getCircledNumber(1)).toBe("①");
		expect(getCircledNumber(2)).toBe("②");
		expect(getCircledNumber(10)).toBe("⑩");
		expect(getCircledNumber(20)).toBe("⑳");
		expect(getCircledNumber(25)).toBe("25");
	});

	it("formats step badge display strings according to format setting", () => {
		expect(formatStepBadgeDisplay({ stepNumber: 3, badgeFormat: "circled" })).toBe("③");
		expect(formatStepBadgeDisplay({ stepNumber: 3, badgeFormat: "number" })).toBe("3");
		expect(formatStepBadgeDisplay({ stepNumber: 3, badgeFormat: "step-prefix" })).toBe("Step 3");
		expect(
			formatStepBadgeDisplay({
				stepNumber: 3,
				badgeFormat: "step-prefix",
				label: "Click Button",
			}),
		).toBe("Step 3: Click Button");
	});

	it("renders text annotations onto canvas", async () => {
		const ctx = createMockCanvasContext();
		const annotations: AnnotationRegion[] = [
			{
				...BASE_REGION,
				type: "text",
				content: "Sample Announcement",
			},
		];

		await renderAnnotations(ctx, annotations, 1920, 1080, 2500, 1.0);
		expect(ctx.fillText).toHaveBeenCalled();
		expect(ctx.save).toHaveBeenCalled();
		expect(ctx.restore).toHaveBeenCalled();
	});

	it("renders figure (arrow) annotations onto canvas", async () => {
		const ctx = createMockCanvasContext();
		const annotations: AnnotationRegion[] = [
			{
				...BASE_REGION,
				type: "figure",
				figureData: { ...DEFAULT_FIGURE_DATA, arrowDirection: "down-right" },
			},
		];

		await renderAnnotations(ctx, annotations, 1920, 1080, 2500, 1.0);
		expect(ctx.stroke).toHaveBeenCalled();
	});

	it("renders step badge annotations with filled and outline styles", async () => {
		const ctx = createMockCanvasContext();
		const annotations: AnnotationRegion[] = [
			{
				...BASE_REGION,
				id: "step-1",
				type: "step",
				stepBadgeData: {
					...DEFAULT_STEP_BADGE_DATA,
					stepNumber: 1,
					badgeFormat: "circled",
					badgeStyle: "filled",
					color: "#2563EB",
					textColor: "#FFFFFF",
				},
			},
			{
				...BASE_REGION,
				id: "step-2",
				type: "step",
				stepBadgeData: {
					...DEFAULT_STEP_BADGE_DATA,
					stepNumber: 2,
					badgeFormat: "number",
					badgeStyle: "outline",
					color: "#10B981",
				},
			},
		];

		await renderAnnotations(ctx, annotations, 1920, 1080, 1000, 1.0);
		expect(ctx.arc).toHaveBeenCalled();
		expect(ctx.fill).toHaveBeenCalled();
		expect(ctx.fillText).toHaveBeenCalledWith("①", expect.any(Number), expect.any(Number));
		expect(ctx.fillText).toHaveBeenCalledWith("2", expect.any(Number), expect.any(Number));
	});

	it("renders step badge annotations with pill style and label", async () => {
		const ctx = createMockCanvasContext();
		const annotations: AnnotationRegion[] = [
			{
				...BASE_REGION,
				type: "step",
				stepBadgeData: {
					stepNumber: 4,
					badgeFormat: "step-prefix",
					badgeStyle: "pill",
					label: "Save Changes",
					color: "#F59E0B",
				},
			},
		];

		await renderAnnotations(ctx, annotations, 1920, 1080, 1000, 1.0);
		expect(ctx.roundRect).toHaveBeenCalled();
		expect(ctx.fillText).toHaveBeenCalledWith(
			"Step 4: Save Changes",
			expect.any(Number),
			expect.any(Number),
		);
	});

	it("renders highlighter annotations in box, underline, and marker styles", async () => {
		const ctx = createMockCanvasContext();
		const annotations: AnnotationRegion[] = [
			{
				...BASE_REGION,
				id: "hl-1",
				type: "highlight",
				highlighterData: {
					color: "#FDE047",
					opacity: 0.5,
					highlightStyle: "box",
					borderRadius: 6,
				},
			},
			{
				...BASE_REGION,
				id: "hl-2",
				type: "highlight",
				highlighterData: {
					color: "#67E8F9",
					opacity: 0.6,
					highlightStyle: "underline",
				},
			},
			{
				...BASE_REGION,
				id: "hl-3",
				type: "highlight",
				highlighterData: {
					color: "#86EFAC",
					opacity: 0.4,
					highlightStyle: "marker",
				},
			},
		];

		await renderAnnotations(ctx, annotations, 1920, 1080, 1000, 1.0);
		expect(ctx.roundRect).toHaveBeenCalledTimes(3);
		expect(ctx.fill).toHaveBeenCalled();
	});

	it("renders vector shape annotations (rectangle and circle with dashed lines)", async () => {
		const ctx = createMockCanvasContext();
		const annotations: AnnotationRegion[] = [
			{
				...BASE_REGION,
				id: "shape-1",
				type: "shape",
				shapeData: {
					shapeKind: "rectangle",
					strokeColor: "#EF4444",
					strokeWidth: 4,
					strokeStyle: "dashed",
					fillColor: "rgba(255, 0, 0, 0.1)",
					cornerRadius: 8,
				},
			},
			{
				...BASE_REGION,
				id: "shape-2",
				type: "shape",
				shapeData: {
					shapeKind: "circle",
					strokeColor: "#3B82F6",
					strokeWidth: 3,
					strokeStyle: "dotted",
					fillColor: "transparent",
				},
			},
		];

		await renderAnnotations(ctx, annotations, 1920, 1080, 1000, 1.0);
		expect(ctx.setLineDash).toHaveBeenCalled();
		expect(ctx.roundRect).toHaveBeenCalled();
		expect(ctx.ellipse).toHaveBeenCalled();
		expect(ctx.stroke).toHaveBeenCalled();
	});

	it("rasterizes annotations via renderAnnotationToCanvas", async () => {
		// In node/vitest, document.createElement('canvas') is mocked or supported by jsdom
		if (typeof document !== "undefined") {
			const stepCanvas = await renderAnnotationToCanvas(
				{
					...BASE_REGION,
					type: "step",
					stepBadgeData: { stepNumber: 1, badgeFormat: "circled" },
				},
				100,
				100,
			);
			expect(stepCanvas).toBeDefined();

			const highlightCanvas = await renderAnnotationToCanvas(
				{
					...BASE_REGION,
					type: "highlight",
					highlighterData: { color: "#FDE047", opacity: 0.45, highlightStyle: "box" },
				},
				200,
				50,
			);
			expect(highlightCanvas).toBeDefined();

			const shapeCanvas = await renderAnnotationToCanvas(
				{
					...BASE_REGION,
					type: "shape",
					shapeData: { shapeKind: "rectangle", strokeColor: "#EF4444", strokeWidth: 4 },
				},
				200,
				150,
			);
			expect(shapeCanvas).toBeDefined();
		}
	});

	it("skips annotations outside the current time window", async () => {
		const ctx = createMockCanvasContext();
		const annotations: AnnotationRegion[] = [
			{
				...BASE_REGION,
				startMs: 2000,
				endMs: 4000,
				type: "step",
				stepBadgeData: { stepNumber: 1 },
			},
		];

		await renderAnnotations(ctx, annotations, 1920, 1080, 500, 1.0); // before start
		expect(ctx.fillText).not.toHaveBeenCalled();

		await renderAnnotations(ctx, annotations, 1920, 1080, 4500, 1.0); // after end
		expect(ctx.fillText).not.toHaveBeenCalled();

		await renderAnnotations(ctx, annotations, 1920, 1080, 3000, 1.0); // within range
		expect(ctx.fillText).toHaveBeenCalled();
	});
});
