import React, { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	type MarqueeRegion,
	REGION_PRESETS,
	clampRegionToBounds,
	createPresetRegion,
} from "./regionCapture";

interface InteractiveRegionSelectorProps {
	open: boolean;
	onClose: () => void;
	onConfirm: (region: MarqueeRegion) => void;
	initialRegion?: MarqueeRegion | null;
}

type HandleDirection = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "move";

const MoveIcon = ({ className }: { className?: string }) => (
	<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
		<path
			d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	</svg>
);

const MaximizeIcon = ({ className }: { className?: string }) => (
	<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
		<path
			d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	</svg>
);

const CloseIcon = ({ className }: { className?: string }) => (
	<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
		<path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
	</svg>
);

const ConfirmIcon = ({ className }: { className?: string }) => (
	<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
		<path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
	</svg>
);

export const InteractiveRegionSelector: React.FC<InteractiveRegionSelectorProps> = ({
	open,
	onClose,
	onConfirm,
	initialRegion,
}) => {
	const [screenWidth, setScreenWidth] = useState(() =>
		typeof window !== "undefined" ? window.innerWidth : 1920,
	);
	const [screenHeight, setScreenHeight] = useState(() =>
		typeof window !== "undefined" ? window.innerHeight : 1080,
	);

	const [region, setRegion] = useState<MarqueeRegion>(() => {
		if (initialRegion) return initialRegion;
		const w = typeof window !== "undefined" ? window.innerWidth : 1920;
		const h = typeof window !== "undefined" ? window.innerHeight : 1080;
		return createPresetRegion("720p", w, h);
	});

	const [activePreset, setActivePreset] = useState<string>("720p");
	const interactionRef = useRef<{
		mode: HandleDirection | "create";
		startX: number;
		startY: number;
		startRegion: MarqueeRegion;
	} | null>(null);

	// Update screen size on resize
	useEffect(() => {
		const handleResize = () => {
			const w = window.innerWidth;
			const h = window.innerHeight;
			setScreenWidth(w);
			setScreenHeight(h);
			setRegion((prev) => clampRegionToBounds(prev, w, h));
		};
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	// Keyboard controls: Enter to confirm, Escape to cancel
	useEffect(() => {
		if (!open) return;
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				e.preventDefault();
				e.stopPropagation();
				onClose();
			} else if (e.key === "Enter") {
				e.preventDefault();
				e.stopPropagation();
				onConfirm(region);
			}
		};
		window.addEventListener("keydown", handleKeyDown, true);
		return () => window.removeEventListener("keydown", handleKeyDown, true);
	}, [open, region, onClose, onConfirm]);

	// Apply preset
	const applyPreset = useCallback(
		(presetId: string) => {
			setActivePreset(presetId);
			const newRegion = createPresetRegion(presetId, screenWidth, screenHeight);
			setRegion(newRegion);
		},
		[screenWidth, screenHeight],
	);

	// Pointer down on resize handle or move area
	const handlePointerDown = (
		e: React.PointerEvent,
		mode: HandleDirection | "create",
	) => {
		e.preventDefault();
		e.stopPropagation();
		(e.target as HTMLElement).setPointerCapture(e.pointerId);

		interactionRef.current = {
			mode,
			startX: e.clientX,
			startY: e.clientY,
			startRegion: { ...region },
		};
	};

	// Pointer down on background: start drawing a new marquee from scratch
	const handleBackdropPointerDown = (e: React.PointerEvent) => {
		e.preventDefault();
		(e.target as HTMLElement).setPointerCapture(e.pointerId);

		const startX = e.clientX;
		const startY = e.clientY;
		const newStartRegion: MarqueeRegion = {
			x: startX,
			y: startY,
			width: 1,
			height: 1,
			screenWidth,
			screenHeight,
		};
		setRegion(newStartRegion);
		setActivePreset("custom");
		interactionRef.current = {
			mode: "create",
			startX,
			startY,
			startRegion: newStartRegion,
		};
	};

	// Global pointer move
	const handlePointerMove = (e: React.PointerEvent) => {
		if (!interactionRef.current) return;
		const { mode, startX, startY, startRegion } = interactionRef.current;
		const dx = e.clientX - startX;
		const dy = e.clientY - startY;

		if (mode === "create") {
			const x = Math.min(startX, e.clientX);
			const y = Math.min(startY, e.clientY);
			const width = Math.abs(e.clientX - startX);
			const height = Math.abs(e.clientY - startY);
			setRegion(
				clampRegionToBounds(
					{ x, y, width: Math.max(20, width), height: Math.max(20, height), screenWidth, screenHeight },
					screenWidth,
					screenHeight,
				),
			);
			return;
		}

		if (mode === "move") {
			const nextX = startRegion.x + dx;
			const nextY = startRegion.y + dy;
			setRegion(
				clampRegionToBounds(
					{ ...startRegion, x: nextX, y: nextY },
					screenWidth,
					screenHeight,
				),
			);
			return;
		}

		setActivePreset("custom");
		let nextX = startRegion.x;
		let nextY = startRegion.y;
		let nextW = startRegion.width;
		let nextH = startRegion.height;

		if (mode.includes("e")) {
			nextW = Math.max(30, startRegion.width + dx);
		}
		if (mode.includes("s")) {
			nextH = Math.max(30, startRegion.height + dy);
		}
		if (mode.includes("w")) {
			const candidateW = startRegion.width - dx;
			if (candidateW >= 30) {
				nextX = startRegion.x + dx;
				nextW = candidateW;
			}
		}
		if (mode.includes("n")) {
			const candidateH = startRegion.height - dy;
			if (candidateH >= 30) {
				nextY = startRegion.y + dy;
				nextH = candidateH;
			}
		}

		setRegion(
			clampRegionToBounds(
				{ x: nextX, y: nextY, width: nextW, height: nextH, screenWidth, screenHeight },
				screenWidth,
				screenHeight,
			),
		);
	};

	// Global pointer up
	const handlePointerUp = (e: React.PointerEvent) => {
		if (interactionRef.current) {
			try {
				(e.target as HTMLElement).releasePointerCapture(e.pointerId);
			} catch {
				// Ignore
			}
			interactionRef.current = null;
		}
	};

	if (!open) return null;

	const hudTop = region.y > 60 ? region.y - 48 : region.y + region.height + 12;

	return (
		<div
			className="fixed inset-0 z-[99999] select-none overflow-hidden cursor-crosshair font-sans"
			onPointerDown={handleBackdropPointerDown}
			onPointerMove={handlePointerMove}
			onPointerUp={handlePointerUp}
			data-testid="interactive-region-selector"
		>
			{/* Dark dimming layer around selection via shadow */}
			<div
				className="absolute border-2 border-indigo-500 bg-indigo-500/10 transition-shadow duration-75 cursor-move"
				style={{
					left: `${region.x}px`,
					top: `${region.y}px`,
					width: `${region.width}px`,
					height: `${region.height}px`,
					boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.65)",
				}}
				onPointerDown={(e) => handlePointerDown(e, "move")}
			>
				{/* Center crosshair & move helper */}
				<div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
					<MoveIcon className="w-8 h-8 text-white stroke-[1.5]" />
				</div>

				{/* 8 Resize Handles */}
				{(
					[
						{ dir: "nw", style: "top-[-6px] left-[-6px] cursor-nwse-resize" },
						{ dir: "n", style: "top-[-6px] left-1/2 -translate-x-1/2 cursor-ns-resize" },
						{ dir: "ne", style: "top-[-6px] right-[-6px] cursor-nesw-resize" },
						{ dir: "e", style: "top-1/2 right-[-6px] -translate-y-1/2 cursor-ew-resize" },
						{ dir: "se", style: "bottom-[-6px] right-[-6px] cursor-nwse-resize" },
						{ dir: "s", style: "bottom-[-6px] left-1/2 -translate-x-1/2 cursor-ns-resize" },
						{ dir: "sw", style: "bottom-[-6px] left-[-6px] cursor-nesw-resize" },
						{ dir: "w", style: "top-1/2 left-[-6px] -translate-y-1/2 cursor-ew-resize" },
					] as const
				).map(({ dir, style }) => (
					<div
						key={dir}
						className={`absolute w-3.5 h-3.5 bg-white border-2 border-indigo-600 rounded-sm shadow-md hover:scale-125 transition-transform ${style}`}
						onPointerDown={(e) => handlePointerDown(e, dir as HandleDirection)}
					/>
				))}
			</div>

			{/* Floating Top Control HUD */}
			<div
				className="absolute z-10 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900/90 backdrop-blur-md border border-white/10 shadow-2xl text-white transition-all pointer-events-auto"
				style={{
					left: `${Math.max(16, Math.min(screenWidth - 440, region.x))}px`,
					top: `${Math.max(12, Math.min(screenHeight - 56, hudTop))}px`,
				}}
				onPointerDown={(e) => e.stopPropagation()}
			>
				{/* Live Dimension Readout */}
				<div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 border border-white/5 text-xs font-mono text-zinc-300">
					<MaximizeIcon className="w-3.5 h-3.5 text-indigo-400" />
					<span className="font-semibold text-white">
						{Math.round(region.width)} × {Math.round(region.height)}
					</span>
					<span className="text-zinc-500 text-[10px]">
						({Math.round(region.x)}, {Math.round(region.y)})
					</span>
				</div>

				<div className="h-4 w-px bg-white/10 mx-0.5" />

				{/* Presets Chips */}
				<div className="flex items-center gap-1">
					{REGION_PRESETS.map((p) => (
						<button
							key={p.id}
							type="button"
							onClick={() => applyPreset(p.id)}
							className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
								activePreset === p.id
									? "bg-indigo-600 text-white shadow-sm"
									: "text-zinc-400 hover:text-white hover:bg-white/10"
							}`}
						>
							{p.id === "1080p"
								? "1080p"
								: p.id === "720p"
									? "720p"
									: p.id === "square"
										? "1:1"
										: p.id === "vertical"
											? "9:16"
											: p.id === "4_3"
												? "4:3"
												: "Custom"}
						</button>
					))}
				</div>

				<div className="h-4 w-px bg-white/10 mx-0.5" />

				{/* Action Buttons */}
				<Button
					size="sm"
					variant="ghost"
					className="h-7 px-2 text-xs text-zinc-400 hover:text-white hover:bg-white/10 gap-1"
					onClick={onClose}
					title="Cancel (Esc)"
				>
					<CloseIcon className="w-3.5 h-3.5" />
					<span>Cancel</span>
				</Button>

				<Button
					size="sm"
					className="h-7 px-3 text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-md shadow-indigo-600/30 gap-1"
					onClick={() => onConfirm(region)}
					title="Confirm Selection (Enter)"
				>
					<ConfirmIcon className="w-3.5 h-3.5 stroke-[2.5]" />
					<span>Record Region</span>
				</Button>
			</div>
		</div>
	);
};
