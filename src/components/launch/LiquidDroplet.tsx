import { motion, type HTMLMotionProps } from "motion/react";
import type { ReactNode } from "react";
import styles from "./LaunchWindow.module.css";

interface LiquidDropletProps extends HTMLMotionProps<"div"> {
	children: ReactNode;
	className?: string;
	glow?: "violet" | "cyan" | "red" | "glass" | "none";
}

/**
 * LiquidDroplet wrapper with fluid surface tension physics.
 * Simulates organic liquid droplet bounce on hover and volume-conserving squish on tap.
 */
export function LiquidDroplet({
	children,
	className = "",
	glow = "glass",
	...props
}: LiquidDropletProps) {
	const glowClass =
		glow === "violet"
			? styles.dropletGlow_violet
			: glow === "cyan"
				? styles.dropletGlow_cyan
				: glow === "red"
					? styles.dropletGlow_red
					: glow === "glass"
						? styles.dropletGlow_glass
						: "";

	return (
		<motion.div
			className={`${styles.liquidDroplet} ${glowClass} ${className}`}
			whileHover={{
				scale: 1.1,
				y: -2,
			}}
			whileTap={{
				scaleX: 1.16,
				scaleY: 0.84,
				y: 1.5,
			}}
			transition={{
				type: "spring",
				stiffness: 480,
				damping: 14,
				mass: 0.7,
			}}
			{...props}
		>
			{children}
		</motion.div>
	);
}
