import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import styles from "./SplashScreen.module.css";

export interface SplashScreenProps {
	onComplete?: () => void;
	minimumDurationMs?: number;
}

const DIAGNOSTIC_STEPS = [
	{ threshold: 0, text: "Initializing Studio Engine..." },
	{ threshold: 28, text: "Calibrating Liquid Glass HUD..." },
	{ threshold: 62, text: "Preparing Studio Canvas & 8K Wallpapers..." },
	{ threshold: 88, text: "MotionCap Studio Ready." },
];

export function SplashScreen({
	onComplete,
	minimumDurationMs = 2000,
}: SplashScreenProps) {
	const [progress, setProgress] = useState(0);
	const [isDismissing, setIsDismissing] = useState(false);
	const hasCompletedRef = useRef(false);

	const handleComplete = useCallback(() => {
		if (hasCompletedRef.current) return;
		hasCompletedRef.current = true;
		setIsDismissing(true);
		setTimeout(() => {
			onComplete?.();
		}, 480);
	}, [onComplete]);

	// Simulate high-tech startup diagnostics and loader
	useEffect(() => {
		const startTime = performance.now();
		const interval = setInterval(() => {
			const elapsed = performance.now() - startTime;
			const ratio = Math.min(elapsed / minimumDurationMs, 1);
			// Ease out cubic
			const curvedProgress = Math.round((1 - Math.pow(1 - ratio, 3)) * 100);

			setProgress(curvedProgress);

			if (ratio >= 1) {
				clearInterval(interval);
				setTimeout(() => {
					handleComplete();
				}, 250);
			}
		}, 30);

		return () => clearInterval(interval);
	}, [minimumDurationMs, handleComplete]);

	// Support click or keyboard to bypass immediately
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape" || e.key === " " || e.key === "Enter") {
				handleComplete();
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [handleComplete]);

	// Current step text based on progress
	const currentStep =
		[...DIAGNOSTIC_STEPS].reverse().find((step) => progress >= step.threshold)?.text ??
		DIAGNOSTIC_STEPS[0].text;

	return (
		<AnimatePresence>
			{!isDismissing && (
				<motion.div
					className={styles.splashContainer}
					onClick={handleComplete}
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{
						opacity: 0,
						scale: 1.04,
						filter: "blur(16px)",
						transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
					}}
					role="presentation"
					aria-label="MotionCap Studio Splash Screen"
				>
					<div className={styles.glowLayer} />
					<div className={styles.meshGrid} />

					<div className={styles.contentWrapper}>
						{/* Animated 3D Liquid Droplet Gem */}
						<motion.div
							className={styles.dropletGem}
							initial={{ scale: 0.6, rotate: -15, opacity: 0 }}
							animate={{
								scale: 1,
								rotate: 0,
								opacity: 1,
								transition: {
									type: "spring",
									stiffness: 280,
									damping: 18,
									mass: 0.8,
								},
							}}
							whileHover={{ scale: 1.08 }}
						>
							<div className={styles.dropletRefraction} />
							<img
								src={`${import.meta.env.BASE_URL}app-icons/motioncap-128.png`}
								alt="MotionCap Logo"
								className={styles.gemIcon}
							/>
						</motion.div>

						{/* Brand Titles */}
						<motion.h1
							className={styles.brandTitle}
							initial={{ y: 16, opacity: 0 }}
							animate={{
								y: 0,
								opacity: 1,
								transition: { delay: 0.15, duration: 0.45, ease: "easeOut" },
							}}
						>
							MotionCap
						</motion.h1>

						<motion.div
							className={styles.badgePill}
							initial={{ y: 10, opacity: 0 }}
							animate={{
								y: 0,
								opacity: 1,
								transition: { delay: 0.25, duration: 0.4, ease: "easeOut" },
							}}
						>
							<span className={styles.badgeDot} />
							STUDIO EDITION
						</motion.div>

						{/* Progress and Diagnostics */}
						<motion.div
							className={styles.progressArea}
							initial={{ opacity: 0, y: 12 }}
							animate={{
								opacity: 1,
								y: 0,
								transition: { delay: 0.3, duration: 0.4 },
							}}
						>
							<div className={styles.progressTrack}>
								<div
									className={styles.progressBar}
									style={{ width: `${progress}%` }}
								/>
							</div>

							<div className={styles.statusRow}>
								<span className={styles.statusMessage}>{currentStep}</span>
								<span className={styles.statusPercent}>{progress}%</span>
							</div>
						</motion.div>
					</div>

					<div className={styles.dismissHint}>Click anywhere or press Esc to skip</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
export default SplashScreen;
