import React, { useState } from "react";
import type { DeviceFrameStyle } from "./deviceFrames";
import { DEVICE_FRAMES } from "./deviceFrames";

export interface WindowFrameOverlayProps {
	style: DeviceFrameStyle;
	frameRect?: { x: number; y: number; width: number; height: number } | null;
	maskRect?: { x: number; y: number; width: number; height: number } | null;
	borderRadius?: number;
	title?: string;
	url?: string;
	className?: string;
}

export const WindowFrameOverlay: React.FC<WindowFrameOverlayProps> = ({
	style,
	frameRect,
	maskRect,
	borderRadius = 8,
	title,
	url,
	className = "",
}) => {
	const [hoveredButtons, setHoveredButtons] = useState(false);

	if (style === "none" || !frameRect || !maskRect || frameRect.width <= 0) {
		return null;
	}

	const config = DEVICE_FRAMES[style];
	if (!config) return null;

	const headerHeight = Math.max(26, maskRect.y - frameRect.y);
	const isDark = config.isDark;
	const displayTitle = title || config.defaultTitle || "MotionCap";
	const displayUrl = url || config.defaultUrl || "motioncap.app";

	// Scale border radius to header
	const scaledRadius = Math.max(0, Math.min(24, (borderRadius / 100) * (frameRect.width * 0.08)));

	return (
		<div
			className={`pointer-events-none absolute z-20 select-none overflow-hidden ${className}`}
			style={{
				left: frameRect.x,
				top: frameRect.y,
				width: frameRect.width,
				height: headerHeight,
				borderTopLeftRadius: scaledRadius,
				borderTopRightRadius: scaledRadius,
				background: isDark
					? "linear-gradient(180deg, #2a2a2e 0%, #1f1f23 100%)"
					: "linear-gradient(180deg, #f6f6f8 0%, #e8e8ed 100%)",
				borderBottom: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid rgba(0, 0, 0, 0.08)",
				boxShadow: isDark
					? "inset 0 1px 0 rgba(255, 255, 255, 0.12)"
					: "inset 0 1px 0 rgba(255, 255, 255, 0.8)",
			}}
			aria-hidden="true"
		>
			<div className="relative flex h-full w-full items-center px-3.5">
				{/* Traffic light buttons */}
				{config.hasTrafficLights && (
					<div
						className="flex items-center gap-2 pointer-events-auto"
						onMouseEnter={() => setHoveredButtons(true)}
						onMouseLeave={() => setHoveredButtons(false)}
					>
						<div
							className="relative flex h-3 w-3 items-center justify-center rounded-full border shadow-sm transition-transform active:scale-95"
							style={{
								backgroundColor: "#ff5f57",
								borderColor: "#e0443e",
							}}
						>
							{hoveredButtons && (
								<svg
									className="h-1.5 w-1.5 opacity-80"
									viewBox="0 0 6 6"
									fill="none"
									stroke="#4d0000"
									strokeWidth="1.2"
									strokeLinecap="round"
								>
									<line x1="1" y1="1" x2="5" y2="5" />
									<line x1="5" y1="1" x2="1" y2="5" />
								</svg>
							)}
						</div>
						<div
							className="relative flex h-3 w-3 items-center justify-center rounded-full border shadow-sm transition-transform active:scale-95"
							style={{
								backgroundColor: "#febc2e",
								borderColor: "#d89e24",
							}}
						>
							{hoveredButtons && (
								<svg
									className="h-1.5 w-1.5 opacity-80"
									viewBox="0 0 6 6"
									fill="none"
									stroke="#593b00"
									strokeWidth="1.2"
									strokeLinecap="round"
								>
									<line x1="1" y1="3" x2="5" y2="3" />
								</svg>
							)}
						</div>
						<div
							className="relative flex h-3 w-3 items-center justify-center rounded-full border shadow-sm transition-transform active:scale-95"
							style={{
								backgroundColor: "#28c840",
								borderColor: "#1aab29",
							}}
						>
							{hoveredButtons && (
								<svg
									className="h-1.5 w-1.5 opacity-80"
									viewBox="0 0 6 6"
									fill="#004d00"
								>
									<path d="M1 5L5 1M5 1H2M5 1V4" stroke="#004d00" strokeWidth="1" />
								</svg>
							)}
						</div>
					</div>
				)}

				{/* Browser Address Bar */}
				{config.hasAddressBar ? (
					<div className="flex flex-1 items-center justify-center px-4">
						<div className="flex items-center gap-2 mr-3 opacity-60">
							<svg
								className="h-3 w-3"
								viewBox="0 0 24 24"
								fill="none"
								stroke={isDark ? "#ffffff" : "#000000"}
								strokeWidth="2.5"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<polyline points="15 18 9 12 15 6" />
							</svg>
							<svg
								className="h-3 w-3 opacity-40"
								viewBox="0 0 24 24"
								fill="none"
								stroke={isDark ? "#ffffff" : "#000000"}
								strokeWidth="2.5"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<polyline points="9 18 15 12 9 6" />
							</svg>
						</div>
						<div
							className={`flex items-center justify-center gap-1.5 max-w-sm w-full h-6 px-3 rounded-md text-[11px] font-medium tracking-tight shadow-inner ${
								isDark
									? "bg-black/30 border border-white/10 text-white/80"
									: "bg-white/70 border border-black/10 text-neutral-800"
							}`}
						>
							<svg
								className={`h-2.5 w-2.5 ${isDark ? "text-emerald-400" : "text-emerald-600"}`}
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2.5"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
								<path d="M7 11V7a5 5 0 0 1 10 0v4" />
							</svg>
							<span className="truncate">{displayUrl}</span>
						</div>
					</div>
				) : (
					/* Standard Window Title */
					<div className="pointer-events-none absolute inset-0 flex items-center justify-center">
						<span
							className={`text-xs font-medium tracking-tight truncate max-w-xs ${
								isDark ? "text-white/70" : "text-neutral-700"
							}`}
						>
							{displayTitle}
						</span>
					</div>
				)}
			</div>
		</div>
	);
};

export default WindowFrameOverlay;
