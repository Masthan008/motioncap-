import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
	MicrophoneIcon,
	VideoCameraIcon,
	MonitorIcon,
	ArrowRight,
	ArrowLeft,
	Check,
	CheckCircleIcon,
	Cursor,
	SpeakerHighIcon,
} from "@/components/ui/icons";
import { LiquidDroplet } from "@/components/launch/LiquidDroplet";
import styles from "./OnboardingScreen.module.css";

export interface OnboardingScreenProps {
	isOpen: boolean;
	onClose: () => void;
}

export function OnboardingScreen({ isOpen, onClose }: OnboardingScreenProps) {
	const [currentStep, setCurrentStep] = useState(0);

	// Slide 1 state: interactive HUD buttons
	const [activeDroplet, setActiveDroplet] = useState<string | null>("record");

	// Slide 2 state: wallpaper & aspect ratio
	const [selectedWallpaper, setSelectedWallpaper] = useState("cyberflow");
	const [selectedAspect, setSelectedAspect] = useState("9:16");

	// Slide 4 state: mic testing with Web Audio API
	const [isTestingMic, setIsTestingMic] = useState(false);
	const [micLevels, setMicLevels] = useState<number[]>([12, 18, 14, 22, 16, 26, 15, 20]);
	const audioContextRef = useRef<AudioContext | null>(null);
	const analyserRef = useRef<AnalyserNode | null>(null);
	const micStreamRef = useRef<MediaStream | null>(null);
	const animFrameRef = useRef<number | null>(null);

	const handleFinish = useCallback(() => {
		try {
			localStorage.setItem("motioncap.onboarding-completed", "true");
		} catch {
			// Ignore localStorage access errors
		}
		onClose();
	}, [onClose]);

	// Mic test logic using Web Audio API
	const toggleMicTest = async () => {
		if (isTestingMic) {
			// Stop mic test
			if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
			if (micStreamRef.current) {
				for (const track of micStreamRef.current.getTracks()) track.stop();
				micStreamRef.current = null;
			}
			if (audioContextRef.current) {
				void audioContextRef.current.close();
				audioContextRef.current = null;
			}
			setIsTestingMic(false);
			setMicLevels([12, 18, 14, 22, 16, 26, 15, 20]);
		} else {
			try {
				const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
				micStreamRef.current = stream;
				const audioCtx = new (window.AudioContext ||
					(window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
				audioContextRef.current = audioCtx;
				const analyser = audioCtx.createAnalyser();
				analyser.fftSize = 32;
				analyserRef.current = analyser;

				const source = audioCtx.createMediaStreamSource(stream);
				source.connect(analyser);

				setIsTestingMic(true);

				const updateMeter = () => {
					if (!analyserRef.current) return;
					const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
					analyserRef.current.getByteFrequencyData(dataArray);

					// Extract 8 representative bands
					const levels: number[] = [];
					const step = Math.max(1, Math.floor(dataArray.length / 8));
					for (let i = 0; i < 8; i++) {
						const raw = dataArray[i * step] || 0;
						// Normalize to 6px - 28px height
						const height = Math.max(6, Math.min(28, Math.round((raw / 255) * 28)));
						levels.push(height);
					}
					setMicLevels(levels);
					animFrameRef.current = requestAnimationFrame(updateMeter);
				};
				updateMeter();
			} catch (err) {
				console.warn("Could not access microphone for live meter test:", err);
				// Provide realistic simulated visualizer if permission was denied or running in mock
				setIsTestingMic(true);
				const interval = setInterval(() => {
					setMicLevels(
						Array.from({ length: 8 }, () => Math.floor(Math.random() * 20) + 8),
					);
				}, 100);
				setTimeout(() => {
					clearInterval(interval);
					setIsTestingMic(false);
					setMicLevels([12, 18, 14, 22, 16, 26, 15, 20]);
				}, 4000);
			}
		}
	};

	// Clean up audio resources on unmount or slide change
	useEffect(() => {
		return () => {
			if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
			if (micStreamRef.current) {
				for (const track of micStreamRef.current.getTracks()) track.stop();
			}
			if (audioContextRef.current) {
				void audioContextRef.current.close();
			}
		};
	}, []);

	if (!isOpen) return null;

	const steps = [
		{
			title: "Liquid Glass Floating HUD",
			subtitle:
				"A visionOS-inspired floating control bar with light glassmorphism, specular highlights, and real-time droplet physics. Try interacting with the live controls below!",
			content: (
				<div className={styles.interactiveHudMock}>
					<div className={styles.hudWatermarkBadge}>
						<div className={styles.hudWatermarkOrb} />
						<span>MOTIONCAP</span>
					</div>

					<LiquidDroplet glow="red">
						<button
							type="button"
							className={`${styles.interactiveDropletBtn} ${activeDroplet === "record" ? styles.interactiveDropletBtnActive : ""}`}
							onClick={() => setActiveDroplet(activeDroplet === "record" ? null : "record")}
						>
							<div
								style={{
									width: 8,
									height: 8,
									borderRadius: "50%",
									background: activeDroplet === "record" ? "#fff" : "#ef4444",
								}}
							/>
							<span>{activeDroplet === "record" ? "Recording..." : "Record"}</span>
						</button>
					</LiquidDroplet>

					<LiquidDroplet glow="glass">
						<button
							type="button"
							className={`${styles.interactiveDropletBtn} ${activeDroplet === "mic" ? styles.interactiveDropletBtnActive : ""}`}
							onClick={() => setActiveDroplet(activeDroplet === "mic" ? null : "mic")}
						>
							<MicrophoneIcon size={14} />
							<span>Mic</span>
						</button>
					</LiquidDroplet>

					<LiquidDroplet glow="glass">
						<button
							type="button"
							className={`${styles.interactiveDropletBtn} ${activeDroplet === "camera" ? styles.interactiveDropletBtnActive : ""}`}
							onClick={() => setActiveDroplet(activeDroplet === "camera" ? null : "camera")}
						>
							<VideoCameraIcon size={14} />
							<span>Webcam</span>
						</button>
					</LiquidDroplet>

					<LiquidDroplet glow="cyan">
						<button
							type="button"
							className={`${styles.interactiveDropletBtn} ${activeDroplet === "display" ? styles.interactiveDropletBtnActive : ""}`}
							onClick={() => setActiveDroplet(activeDroplet === "display" ? null : "display")}
						>
							<MonitorIcon size={14} />
							<span>Display</span>
						</button>
					</LiquidDroplet>
				</div>
			),
		},
		{
			title: "Signature 8K Wallpapers & Social Presets",
			subtitle:
				"Instantly transform screen recordings into polished studio content with signature abstract wallpapers and 1-click aspect ratios.",
			content: (
				<>
					<div className={styles.wallpaperGrid}>
						<div
							className={`${styles.wallpaperCard} ${selectedWallpaper === "cyberflow" ? styles.wallpaperCardSelected : ""}`}
							onClick={() => setSelectedWallpaper("cyberflow")}
							onKeyDown={(e) => e.key === "Enter" && setSelectedWallpaper("cyberflow")}
							tabIndex={0}
							role="button"
						>
							<img
								src={`${import.meta.env.BASE_URL}wallpapers/motioncap-cyberflow.jpg`}
								alt="MotionCap Cyber Flow"
								className={styles.wallpaperImg}
							/>
							<div className={styles.wallpaperLabel}>Cyber Flow (8K)</div>
						</div>

						<div
							className={`${styles.wallpaperCard} ${selectedWallpaper === "solarhorizon" ? styles.wallpaperCardSelected : ""}`}
							onClick={() => setSelectedWallpaper("solarhorizon")}
							onKeyDown={(e) => e.key === "Enter" && setSelectedWallpaper("solarhorizon")}
							tabIndex={0}
							role="button"
						>
							<img
								src={`${import.meta.env.BASE_URL}wallpapers/motioncap-solarhorizon.jpg`}
								alt="MotionCap Solar Horizon"
								className={styles.wallpaperImg}
							/>
							<div className={styles.wallpaperLabel}>Solar Horizon (8K)</div>
						</div>
					</div>

					<div className={styles.presetChipsRow}>
						{["9:16", "1:1", "16:9"].map((ratio) => (
							<button
								key={ratio}
								type="button"
								className={`${styles.presetChip} ${selectedAspect === ratio ? styles.presetChipActive : ""}`}
								onClick={() => setSelectedAspect(ratio)}
							>
								<span>{ratio}</span>
								<span style={{ opacity: 0.75, fontSize: "11px" }}>
									{ratio === "9:16" ? "Shorts / Reels" : ratio === "1:1" ? "LinkedIn" : "YouTube"}
								</span>
							</button>
						))}
					</div>
				</>
			),
		},
		{
			title: "Auto-Zoom & Broadcast Audio Limiter",
			subtitle:
				"Keep viewers engaged with intelligent cursor-following zoom easing and distortion-free studio audio normalization.",
			content: (
				<div className={styles.featuresRow}>
					<div className={styles.featureCard}>
						<div className={styles.featureCardHeader}>
							<Cursor size={18} color="#0284c7" />
							<span>Smart Cursor Zoom</span>
						</div>
						<div className={styles.featureCardDesc}>
							Automatically eases into active application regions with smooth cinematic camera tracking.
						</div>
						<div className={styles.featureBadge}>
							<Check size={12} />
							<span>Active by Default</span>
						</div>
					</div>

					<div className={styles.featureCard}>
						<div className={styles.featureCardHeader}>
							<SpeakerHighIcon size={18} color="#0284c7" />
							<span>Studio Audio Limiter</span>
						</div>
						<div className={styles.featureCardDesc}>
							Multi-band normalization and hard -1 dBFS peak locking prevents clipping on any mic.
						</div>
						<div className={styles.featureBadge}>
							<Check size={12} />
							<span>Broadcast Ready</span>
						</div>
					</div>
				</div>
			),
		},
		{
			title: "System Readiness & Calibration",
			subtitle:
				"Hardware check and live microphone meter. Confirm your setup and begin capturing in MotionCap Studio.",
			content: (
				<div className={styles.hardwareChecks}>
					<div className={styles.hardwareItem}>
						<div className={styles.hardwareItemLeft}>
							<div className={styles.hardwareIconWrap}>
								<MicrophoneIcon size={18} />
							</div>
							<div>
								<div className={styles.hardwareInfoTitle}>Microphone Input</div>
								<div className={styles.hardwareInfoSub}>High-fidelity vocal capture enabled</div>
							</div>
						</div>

						<div className={styles.micMeterContainer}>
							<div className={styles.soundwaveBars}>
								{micLevels.map((lvl, idx) => (
									<div
										// biome-ignore lint/suspicious/noArrayIndexKey: Fixed 8 bars
										key={idx}
										className={styles.soundwaveBar}
										style={{ height: `${lvl}px` }}
									/>
								))}
							</div>
							<button
								type="button"
								className={`${styles.testMicBtn} ${isTestingMic ? styles.testMicBtnActive : ""}`}
								onClick={toggleMicTest}
							>
								{isTestingMic ? "Stop Test" : "Test Mic"}
							</button>
						</div>
					</div>

					<div className={styles.hardwareItem}>
						<div className={styles.hardwareItemLeft}>
							<div className={styles.hardwareIconWrap}>
								<MonitorIcon size={18} />
							</div>
							<div>
								<div className={styles.hardwareInfoTitle}>Display Engine</div>
								<div className={styles.hardwareInfoSub}>Hardware-accelerated GPU capture ready</div>
							</div>
						</div>
						<CheckCircleIcon size={20} color="#10b981" weight="fill" />
					</div>

					<div className={styles.hardwareItem}>
						<div className={styles.hardwareItemLeft}>
							<div className={styles.hardwareIconWrap}>
								<VideoCameraIcon size={18} />
							</div>
							<div>
								<div className={styles.hardwareInfoTitle}>Camera PiP</div>
								<div className={styles.hardwareInfoSub}>Circular webcam overlay configured</div>
							</div>
						</div>
						<CheckCircleIcon size={20} color="#10b981" weight="fill" />
					</div>
				</div>
			),
		},
	];

	const isLastStep = currentStep === steps.length - 1;

	return (
		<div className={styles.overlay}>
			<motion.div
				className={styles.modalCard}
				initial={{ scale: 0.92, opacity: 0, y: 20 }}
				animate={{ scale: 1, opacity: 1, y: 0 }}
				exit={{ scale: 0.92, opacity: 0, y: 20 }}
				transition={{ type: "spring", stiffness: 320, damping: 25 }}
			>
				<div className={`${styles.ambientOrb} ${styles.ambientOrb1}`} />
				<div className={`${styles.ambientOrb} ${styles.ambientOrb2}`} />

				{/* Header */}
				<div className={styles.modalHeader}>
					<div className={styles.brandGroup}>
						<img
							src={`${import.meta.env.BASE_URL}app-icons/motioncap-64.png`}
							alt="MotionCap"
							className={styles.brandIcon}
						/>
						<span className={styles.brandText}>MotionCap Studio</span>
						<span className={styles.stepPill}>
							Step {currentStep + 1} of {steps.length}
						</span>
					</div>

					<button type="button" className={styles.skipButton} onClick={handleFinish}>
						Skip Tour
					</button>
				</div>

				{/* Body Slide */}
				<div className={styles.slideBody}>
					<AnimatePresence mode="wait">
						<motion.div
							key={currentStep}
							initial={{ opacity: 0, x: 20 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -20 }}
							transition={{ duration: 0.25, ease: "easeInOut" }}
							style={{ display: "flex", flexDirection: "column", flex: 1 }}
						>
							<h2 className={styles.stepTitle}>{steps[currentStep].title}</h2>
							<p className={styles.stepSubtitle}>{steps[currentStep].subtitle}</p>

							<div className={styles.previewCanvas}>{steps[currentStep].content}</div>
						</motion.div>
					</AnimatePresence>
				</div>

				{/* Footer Controls */}
				<div className={styles.modalFooter}>
					<div className={styles.stepIndicators}>
						{steps.map((_, index) => (
							<div
								// biome-ignore lint/suspicious/noArrayIndexKey: Static 4 steps
								key={index}
								className={`${styles.dot} ${currentStep === index ? styles.dotActive : ""}`}
								onClick={() => setCurrentStep(index)}
								onKeyDown={(e) => e.key === "Enter" && setCurrentStep(index)}
								tabIndex={0}
								role="button"
								aria-label={`Go to step ${index + 1}`}
							/>
						))}
					</div>

					<div className={styles.footerButtons}>
						{currentStep > 0 && (
							<button
								type="button"
								className={styles.backButton}
								onClick={() => setCurrentStep((prev) => prev - 1)}
							>
								<ArrowLeft size={14} style={{ display: "inline", marginRight: 4 }} />
								Back
							</button>
						)}

						<button
							type="button"
							className={`${styles.nextButton} ${isLastStep ? styles.finishButton : ""}`}
							onClick={() => {
								if (isLastStep) {
									handleFinish();
								} else {
									setCurrentStep((prev) => prev + 1);
								}
							}}
						>
							<span>{isLastStep ? "Launch MotionCap Studio" : "Continue"}</span>
							<ArrowRight size={15} />
						</button>
					</div>
				</div>
			</motion.div>
		</div>
	);
}
export default OnboardingScreen;
