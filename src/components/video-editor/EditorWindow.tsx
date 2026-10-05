import { useEffect, useState } from "react";
import { ShortcutsProvider } from "../../contexts/ShortcutsContext";
import { loadAllCustomFonts } from "../../lib/customFonts";
import { AnnouncementDialog } from "../announcements/AnnouncementDialog";
import { LiveAnnouncementNotifications } from "../announcements/LiveAnnouncementNotifications";
import { ShortcutsConfigDialog } from "./ShortcutsConfigDialog";
import VideoEditor from "./VideoEditor";
import { SplashScreen } from "../splash/SplashScreen";
import { OnboardingScreen } from "../onboarding/OnboardingScreen";

export default function EditorWindow() {
	const [splashDone, setSplashDone] = useState(() => {
		try {
			return Boolean(sessionStorage.getItem("motioncap_splash_shown"));
		} catch {
			return false;
		}
	});

	const [onboardingOpen, setOnboardingOpen] = useState(false);

	useEffect(() => {
		loadAllCustomFonts().catch((error) => {
			console.error("Failed to load custom fonts:", error);
		});

		const handleOpenTour = () => setOnboardingOpen(true);
		window.addEventListener("motioncap:open-onboarding", handleOpenTour);
		return () => window.removeEventListener("motioncap:open-onboarding", handleOpenTour);
	}, []);

	const handleSplashComplete = () => {
		try {
			sessionStorage.setItem("motioncap_splash_shown", "1");
		} catch {
			// ignore storage access errors
		}
		setSplashDone(true);
		try {
			if (localStorage.getItem("motioncap.onboarding-completed") !== "true") {
				setOnboardingOpen(true);
			}
		} catch {
			// ignore storage access errors
		}
	};

	return (
		<>
			<ShortcutsProvider>
				<VideoEditor />
				<ShortcutsConfigDialog />
			</ShortcutsProvider>
			<AnnouncementDialog audience="editor" />
			<LiveAnnouncementNotifications audience="editor" />

			{!splashDone && <SplashScreen onComplete={handleSplashComplete} />}
			<OnboardingScreen
				isOpen={onboardingOpen}
				onClose={() => setOnboardingOpen(false)}
			/>
		</>
	);
}
