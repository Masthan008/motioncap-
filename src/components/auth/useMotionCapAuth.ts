import { demoUser, hasDemoSession, subscribeDemoSession } from "@/lib/auth/demoSession";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
	adaptFirebaseUser,
	completeAuthCallback,
	firebaseAuth,
	motioncapAuthConfigured,
	type User,
} from "@/lib/auth/motioncapAuth";

export function useMotionCapAuth() {
	const demo = useSyncExternalStore(subscribeDemoSession, hasDemoSession, () => false);
	const [user, setUser] = useState<User | null>(null);
	const [accessToken, setAccessToken] = useState<string>();
	const [loading, setLoading] = useState(motioncapAuthConfigured);
	const [callbackError, setCallbackError] = useState<string>();
	const callbackUrl = useRef<string | undefined>(undefined);

	useEffect(() => {
		if (!firebaseAuth) {
			setLoading(false);
			return;
		}

		let mounted = true;
		const unsubscribeAuth = onAuthStateChanged(firebaseAuth, async (fbUser) => {
			if (!mounted) return;
			if (fbUser) {
				const adapted = adaptFirebaseUser(fbUser);
				setUser(adapted);
				try {
					const token = await fbUser.getIdToken();
					if (mounted) setAccessToken(token);
				} catch {
					if (mounted) setAccessToken(undefined);
				}
			} else {
				setUser(null);
				setAccessToken(undefined);
			}
			setLoading(false);
		});

		const handleCallback = async (url: string) => {
			if (!mounted || callbackUrl.current === url) return;
			callbackUrl.current = url;
			try {
				setCallbackError(undefined);
				await completeAuthCallback(url);
			} catch (error) {
				if (mounted)
					setCallbackError(error instanceof Error ? error.message : String(error));
			} finally {
				await window.electronAPI?.ackAuthCallbackUrl?.(url).catch(() => undefined);
			}
		};

		const unsubscribeCallback = window.electronAPI?.onAuthCallbackUrl
			? window.electronAPI.onAuthCallbackUrl((url) => void handleCallback(url))
			: () => {};

		void window.electronAPI?.getPendingAuthCallbackUrl?.().then((url) => {
			if (url) void handleCallback(url);
		});

		return () => {
			mounted = false;
			unsubscribeAuth();
			unsubscribeCallback();
		};
	}, []);

	return {
		user: demo ? demoUser : user,
		accessToken: demo ? undefined : accessToken,
		loading,
		configured: motioncapAuthConfigured,
		callbackError,
	};
}
