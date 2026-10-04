import React from "react";
import type { CursorTelemetryPoint } from "../types";
import {
	findActiveKeystrokeSample,
	formatKeycapLabel,
	parseShortcutTokens,
} from "./keystrokeVisualizer";

export type KeystrokeOverlayPosition = "bottom-center" | "bottom-left" | "top-center";

export interface KeystrokeOverlayProps {
	cursorTelemetry?: CursorTelemetryPoint[];
	currentTimeMs: number;
	visible?: boolean;
	position?: KeystrokeOverlayPosition;
	className?: string;
}

export const KeystrokeOverlay: React.FC<KeystrokeOverlayProps> = ({
	cursorTelemetry,
	currentTimeMs,
	visible = true,
	position = "bottom-center",
	className = "",
}) => {
	if (!visible) {
		return null;
	}

	const activeSample = findActiveKeystrokeSample(cursorTelemetry, currentTimeMs);
	if (!activeSample) {
		return null;
	}

	const tokens = parseShortcutTokens(activeSample.keystroke);
	if (tokens.length === 0) {
		return null;
	}

	let positionClasses = "bottom-8 left-1/2 -translate-x-1/2";
	if (position === "bottom-left") {
		positionClasses = "bottom-8 left-8";
	} else if (position === "top-center") {
		positionClasses = "top-8 left-1/2 -translate-x-1/2";
	}

	return (
		<div
			className={`pointer-events-none absolute z-30 flex items-center gap-1.5 px-3.5 py-2 rounded-xl backdrop-blur-md bg-neutral-950/85 border border-white/20 shadow-2xl shadow-black/60 select-none ${positionClasses} ${className}`}
			style={{
				opacity: activeSample.opacity,
				transform: `${
					position === "bottom-center" || position === "top-center"
						? "translateX(-50%) "
						: ""
				}scale(${activeSample.scale})`,
				transformOrigin: "center center",
				willChange: "transform, opacity",
				transition: "opacity 60ms linear, transform 60ms cubic-bezier(0.16, 1, 0.3, 1)",
			}}
			aria-label={`Shortcut: ${activeSample.keystroke}`}
			role="status"
		>
			{tokens.map((token, index) => (
				<React.Fragment key={`${token}-${index}`}>
					{index > 0 && (
						<span className="text-xs font-bold text-white/40 px-0.5 select-none">+</span>
					)}
					<kbd className="inline-flex items-center justify-center min-w-7 h-7 px-2.5 text-xs font-semibold font-mono tracking-tight text-white bg-white/10 hover:bg-white/15 border border-white/25 rounded-md shadow-[0_2px_0_rgba(255,255,255,0.18)]">
						{formatKeycapLabel(token)}
					</kbd>
				</React.Fragment>
			))}
		</div>
	);
};

export default KeystrokeOverlay;
