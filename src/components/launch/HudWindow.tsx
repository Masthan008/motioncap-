import { useState, useEffect, useCallback } from "react";
import { Toaster } from "../ui/toast";
import { LaunchWindow } from "./LaunchWindow";
import { OnboardingScreen } from "../onboarding/OnboardingScreen";

export default function HudWindow() {
	const [onboardingOpen, setOnboardingOpen] = useState(false);

	useEffect(() => {
		const handleOpen = () => setOnboardingOpen(true);
		window.addEventListener("motioncap:open-onboarding", handleOpen);
		return () => window.removeEventListener("motioncap:open-onboarding", handleOpen);
	}, []);

	// Keep mouse passthrough disabled while the onboarding modal is open.
	// Without this, useLaunchHudInteractionState's automatic
	// setIgnoreMouseEvents(true) swallows all clicks meant for the modal.
	useEffect(() => {
		if (onboardingOpen) {
			window.electronAPI?.hudOverlaySetIgnoreMouse?.(false);
		}
	}, [onboardingOpen]);

	const handleOnboardingClose = useCallback(() => {
		setOnboardingOpen(false);
		// Allow the overlay to unmount before restoring passthrough so the
		// mouseover handler won't find the stale data-hud-interactive attribute.
		setTimeout(() => {
			window.electronAPI?.hudOverlaySetIgnoreMouse?.(true);
		}, 100);
	}, []);

	return (
		<>
			<LaunchWindow />
			<Toaster className="pointer-events-auto" />
			<OnboardingScreen
				isOpen={onboardingOpen}
				onClose={handleOnboardingClose}
			/>
		</>
	);
}
