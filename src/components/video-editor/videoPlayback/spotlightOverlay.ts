import type { Graphics } from "pixi.js";
import type { SpotlightSettings } from "../types";

export interface SpotlightRenderParams {
	graphics: Graphics;
	stageWidth: number;
	stageHeight: number;
	cursorX: number;
	cursorY: number;
	settings: SpotlightSettings;
	visible?: boolean;
}

/**
 * Renders the spotlight focus overlay onto a Pixi Graphics layer.
 * Creates a dimmed background across the viewport with a clear/feathered cutout
 * around the active focal point (cursor).
 */
export function renderSpotlightOnGraphics(params: SpotlightRenderParams): void {
	const { graphics, stageWidth, stageHeight, cursorX, cursorY, settings, visible = true } = params;
	graphics.clear();

	if (
		!visible ||
		!settings.enabled ||
		settings.dimOpacity <= 0 ||
		stageWidth <= 0 ||
		stageHeight <= 0
	) {
		graphics.visible = false;
		return;
	}

	graphics.visible = true;
	const radius = Math.max(20, settings.radius);
	const alpha = Math.max(0, Math.min(0.95, settings.dimOpacity));
	const feather = Math.max(0, settings.feather ?? 24);

	// Primary dim overlay with cutout hole at cursor position
	graphics.rect(0, 0, stageWidth, stageHeight);
	graphics.fill({ color: 0x000000, alpha });
	graphics.circle(cursorX, cursorY, radius + feather);
	graphics.cut();

	// Smooth feathering rings inside the transition edge
	if (feather > 4) {
		const steps = 3;
		for (let i = 1; i <= steps; i++) {
			const r = radius + (feather * i) / (steps + 1);
			const stepAlpha = alpha * (i / (steps + 1));
			graphics.circle(cursorX, cursorY, r);
			graphics.stroke({ color: 0x000000, alpha: stepAlpha, width: feather / steps });
		}
	}
}

/**
 * Renders the spotlight focus overlay directly onto a Canvas 2D context.
 * Used for frame export composition and CPU preview fallbacks.
 */
export function renderSpotlightOnCanvas(
	ctx: CanvasRenderingContext2D,
	width: number,
	height: number,
	cursorX: number,
	cursorY: number,
	settings: SpotlightSettings,
): void {
	if (!settings.enabled || settings.dimOpacity <= 0 || width <= 0 || height <= 0) {
		return;
	}

	const radius = Math.max(20, settings.radius);
	const feather = Math.max(0, settings.feather ?? 24);
	const alpha = Math.max(0, Math.min(0.95, settings.dimOpacity));

	ctx.save();
	// Draw full dim rect
	ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
	ctx.fillRect(0, 0, width, height);

	// Cut out spotlight using radial gradient with destination-out
	ctx.globalCompositeOperation = "destination-out";
	const grad = ctx.createRadialGradient(
		cursorX,
		cursorY,
		Math.max(0, radius - feather),
		cursorX,
		cursorY,
		radius + feather,
	);
	grad.addColorStop(0, "rgba(0, 0, 0, 1)");
	grad.addColorStop(1, "rgba(0, 0, 0, 0)");
	ctx.fillStyle = grad;
	ctx.beginPath();
	ctx.arc(cursorX, cursorY, radius + feather, 0, Math.PI * 2);
	ctx.fill();
	ctx.restore();
}
