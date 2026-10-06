import {
	useState,
	useCallback,
	type PointerEvent,
	type RefObject,
} from "react";
import styles from "./LaunchWindow.module.css";
import {
	Crop,
	MagicWand,
	ArrowsMerge,
	X,
} from "@/components/ui/icons";

export type WebcamShape = "squircle" | "circle" | "pill" | "cinematic";
export type WebcamSize = "sm" | "md" | "lg";
export type WebcamFilter = "natural" | "studio" | "vivid" | "mono";

interface LiquidWebcamPreviewProps {
	containerRef: RefObject<HTMLDivElement | null>;
	videoRef: (node: HTMLVideoElement | null) => void;
	offset: { x: number; y: number };
	onPointerDown: (e: PointerEvent<HTMLDivElement>) => void;
	onPointerMove: (e: PointerEvent<HTMLDivElement>) => void;
	onPointerUp: (e: PointerEvent<HTMLDivElement>) => void;
	onMouseEnter?: () => void;
	onMouseLeave?: () => void;
	onClose?: () => void;
}

const STORAGE_KEY_SHAPE = "motioncap_webcam_shape";
const STORAGE_KEY_SIZE = "motioncap_webcam_size";
const STORAGE_KEY_MIRROR = "motioncap_webcam_mirrored";
const STORAGE_KEY_FILTER = "motioncap_webcam_filter";

export function LiquidWebcamPreview({
	containerRef,
	videoRef,
	offset,
	onPointerDown,
	onPointerMove,
	onPointerUp,
	onMouseEnter,
	onMouseLeave,
	onClose,
}: LiquidWebcamPreviewProps) {
	const [shape, setShape] = useState<WebcamShape>(() => {
		const saved = localStorage.getItem(STORAGE_KEY_SHAPE);
		if (saved === "squircle" || saved === "circle" || saved === "pill" || saved === "cinematic") {
			return saved;
		}
		return "squircle";
	});

	const [size, setSize] = useState<WebcamSize>(() => {
		const saved = localStorage.getItem(STORAGE_KEY_SIZE);
		if (saved === "sm" || saved === "md" || saved === "lg") {
			return saved;
		}
		return "md";
	});

	const [mirrored, setMirrored] = useState<boolean>(() => {
		const saved = localStorage.getItem(STORAGE_KEY_MIRROR);
		return saved !== null ? saved === "true" : true;
	});

	const [filter, setFilter] = useState<WebcamFilter>(() => {
		const saved = localStorage.getItem(STORAGE_KEY_FILTER);
		if (saved === "natural" || saved === "studio" || saved === "vivid" || saved === "mono") {
			return saved;
		}
		return "studio";
	});

	const cycleShape = useCallback((e: React.MouseEvent) => {
		e.stopPropagation();
		setShape((prev) => {
			const order: WebcamShape[] = ["squircle", "circle", "pill", "cinematic"];
			const next = order[(order.indexOf(prev) + 1) % order.length];
			localStorage.setItem(STORAGE_KEY_SHAPE, next);
			return next;
		});
	}, []);

	const cycleSize = useCallback((e: React.MouseEvent) => {
		e.stopPropagation();
		setSize((prev) => {
			const order: WebcamSize[] = ["sm", "md", "lg"];
			const next = order[(order.indexOf(prev) + 1) % order.length];
			localStorage.setItem(STORAGE_KEY_SIZE, next);
			return next;
		});
	}, []);

	const toggleMirror = useCallback((e: React.MouseEvent) => {
		e.stopPropagation();
		setMirrored((prev) => {
			const next = !prev;
			localStorage.setItem(STORAGE_KEY_MIRROR, String(next));
			return next;
		});
	}, []);

	const cycleFilter = useCallback((e: React.MouseEvent) => {
		e.stopPropagation();
		setFilter((prev) => {
			const order: WebcamFilter[] = ["natural", "studio", "vivid", "mono"];
			const next = order[(order.indexOf(prev) + 1) % order.length];
			localStorage.setItem(STORAGE_KEY_FILTER, next);
			return next;
		});
	}, []);

	const handleClose = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			onClose?.();
		},
		[onClose],
	);

	const shapeClass =
		shape === "circle"
			? styles.webcamShapeCircle
			: shape === "pill"
				? styles.webcamShapePill
				: shape === "cinematic"
					? styles.webcamShapeCinematic
					: styles.webcamShapeSquircle;

	const sizeClass =
		size === "sm"
			? styles.webcamSizeSm
			: size === "lg"
				? styles.webcamSizeLg
				: styles.webcamSizeMd;

	const filterClass =
		filter === "natural"
			? styles.webcamFilterNatural
			: filter === "vivid"
				? styles.webcamFilterVivid
				: filter === "mono"
					? styles.webcamFilterMono
					: styles.webcamFilterStudio;

	const shapeLabels: Record<WebcamShape, string> = {
		squircle: "Squircle",
		circle: "Circle",
		pill: "Pill",
		cinematic: "4:5",
	};

	const filterLabels: Record<WebcamFilter, string> = {
		natural: "Natural",
		studio: "Studio",
		vivid: "Vivid",
		mono: "B&W",
	};

	return (
		<div
			ref={containerRef}
			className={`${styles.recordingWebcamPreview} ${shapeClass} ${sizeClass} ${styles.electronNoDrag} pointer-events-auto`}
			data-hud-interactive
			title="MotionCap Studio Webcam"
			style={{
				transform: `translate(${offset.x}px, ${offset.y}px)`,
			}}
			onMouseEnter={onMouseEnter}
			onMouseLeave={onMouseLeave}
			onPointerDown={onPointerDown}
			onPointerMove={onPointerMove}
			onPointerUp={onPointerUp}
			onPointerCancel={onPointerUp}
		>
			{/* Specular Liquid Glass Edge Overlay */}
			<div className={styles.webcamSpecularEdge} pointer-events-none="true" />

			{/* Audio Reactive Breathing Glow Rim */}
			<div className={styles.webcamBreathingRim} pointer-events-none="true" />

			{/* Floating visionOS Quick Toolbar (reveals on hover) */}
			<div
				className={styles.webcamQuickToolbar}
				onPointerDown={(e) => e.stopPropagation()}
				onClick={(e) => e.stopPropagation()}
			>
				<button
					type="button"
					className={styles.webcamToolbarBtn}
					onClick={cycleShape}
					title={`Switch Shape: ${shapeLabels[shape]}`}
				>
					<Crop size={13} />
					<span>{shapeLabels[shape]}</span>
				</button>

				<button
					type="button"
					className={styles.webcamToolbarBtn}
					onClick={cycleSize}
					title={`Preset Size: ${size.toUpperCase()}`}
				>
					<ArrowsMerge size={13} />
					<span>{size.toUpperCase()}</span>
				</button>

				<button
					type="button"
					className={`${styles.webcamToolbarBtn} ${mirrored ? styles.webcamToolbarBtnActive : ""}`}
					onClick={toggleMirror}
					title={mirrored ? "Mirrored (Click to Flip)" : "Normal (Click to Mirror)"}
				>
					<span style={{ fontSize: "11px", fontWeight: 700 }}>⇄</span>
					<span>{mirrored ? "Flip" : "Raw"}</span>
				</button>

				<button
					type="button"
					className={`${styles.webcamToolbarBtn} ${filter !== "natural" ? styles.webcamToolbarBtnActive : ""}`}
					onClick={cycleFilter}
					title={`Studio Filter: ${filterLabels[filter]}`}
				>
					<MagicWand size={13} />
					<span>{filterLabels[filter]}</span>
				</button>

				{onClose && (
					<button
						type="button"
						className={`${styles.webcamToolbarBtn} ${styles.webcamToolbarBtnClose}`}
						onClick={handleClose}
						title="Hide Floating Webcam"
					>
						<X size={12} />
					</button>
				)}
			</div>

			{/* Live Video Element */}
			<video
				ref={videoRef}
				className={`${styles.recordingWebcamPreviewVideo} ${filterClass}`}
				muted
				playsInline
				style={{
					transform: mirrored ? "scaleX(-1)" : "scaleX(1)",
				}}
			/>
		</div>
	);
}
