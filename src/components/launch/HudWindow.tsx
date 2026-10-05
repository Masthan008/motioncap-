import { useState, useEffect } from "react";
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

	return (
		<>
			<LaunchWindow />
			<Toaster className="pointer-events-auto" />
			<OnboardingScreen
				isOpen={onboardingOpen}
				onClose={() => setOnboardingOpen(false)}
			/>
		</>
	);
}
