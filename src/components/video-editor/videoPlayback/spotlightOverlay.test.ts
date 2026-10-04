import { describe, expect, it, vi } from "vitest";
import {
	renderSpotlightOnCanvas,
	renderSpotlightOnGraphics,
} from "./spotlightOverlay";
import type { SpotlightSettings } from "../types";

describe("SpotlightOverlay", () => {
	it("hides graphics when spotlight is disabled", () => {
		const mockGraphics = {
			clear: vi.fn(),
			visible: true,
			rect: vi.fn().mockReturnThis(),
			fill: vi.fn().mockReturnThis(),
			circle: vi.fn().mockReturnThis(),
			cut: vi.fn().mockReturnThis(),
			stroke: vi.fn().mockReturnThis(),
		};

		renderSpotlightOnGraphics({
			graphics: mockGraphics as never,
			stageWidth: 1920,
			stageHeight: 1080,
			cursorX: 500,
			cursorY: 400,
			settings: { enabled: false, radius: 150, dimOpacity: 0.5, feather: 20 },
		});

		expect(mockGraphics.clear).toHaveBeenCalled();
		expect(mockGraphics.visible).toBe(false);
	});

	it("renders cutout rect and circle when spotlight is enabled", () => {
		const mockGraphics = {
			clear: vi.fn(),
			visible: false,
			rect: vi.fn().mockReturnThis(),
			fill: vi.fn().mockReturnThis(),
			circle: vi.fn().mockReturnThis(),
			cut: vi.fn().mockReturnThis(),
			stroke: vi.fn().mockReturnThis(),
		};

		renderSpotlightOnGraphics({
			graphics: mockGraphics as never,
			stageWidth: 1920,
			stageHeight: 1080,
			cursorX: 500,
			cursorY: 400,
			settings: { enabled: true, radius: 150, dimOpacity: 0.6, feather: 20 },
		});

		expect(mockGraphics.clear).toHaveBeenCalled();
		expect(mockGraphics.visible).toBe(true);
		expect(mockGraphics.rect).toHaveBeenCalledWith(0, 0, 1920, 1080);
		expect(mockGraphics.fill).toHaveBeenCalledWith({ color: 0x000000, alpha: 0.6 });
		expect(mockGraphics.circle).toHaveBeenCalledWith(500, 400, 170); // radius + feather
		expect(mockGraphics.cut).toHaveBeenCalled();
	});

	it("draws to Canvas 2D with destination-out composite mode", () => {
		const mockGradient = {
			addColorStop: vi.fn(),
		};
		const mockCtx = {
			save: vi.fn(),
			restore: vi.fn(),
			fillRect: vi.fn(),
			beginPath: vi.fn(),
			arc: vi.fn(),
			fill: vi.fn(),
			createRadialGradient: vi.fn().mockReturnValue(mockGradient),
			fillStyle: "",
			globalCompositeOperation: "",
		};

		const settings: SpotlightSettings = {
			enabled: true,
			radius: 120,
			dimOpacity: 0.5,
			feather: 20,
		};

		renderSpotlightOnCanvas(
			mockCtx as never,
			1920,
			1080,
			600,
			450,
			settings,
		);

		expect(mockCtx.save).toHaveBeenCalled();
		expect(mockCtx.fillRect).toHaveBeenCalledWith(0, 0, 1920, 1080);
		expect(mockCtx.createRadialGradient).toHaveBeenCalledWith(600, 450, 100, 600, 450, 140);
		expect(mockGradient.addColorStop).toHaveBeenCalledWith(0, "rgba(0, 0, 0, 1)");
		expect(mockGradient.addColorStop).toHaveBeenCalledWith(1, "rgba(0, 0, 0, 0)");
		expect(mockCtx.restore).toHaveBeenCalled();
	});
});
