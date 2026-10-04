import { initializeApp, getApps, getApp } from "firebase/app";
import {
	getAuth,
	signInWithEmailAndPassword,
	createUserWithEmailAndPassword,
	sendPasswordResetEmail,
	signOut as fbSignOut,
	GoogleAuthProvider,
	OAuthProvider,
	signInWithPopup,
	type User as FirebaseUser,
} from "firebase/auth";
import { demoLoginEnabled, demoUser, hasDemoSession, setDemoSession } from "./demoSession";

export interface MotionCapUser {
	id: string;
	email?: string | null;
	displayName?: string | null;
	photoURL?: string | null;
	user_metadata?: {
		full_name?: string;
		name?: string;
		avatar_url?: string;
		[key: string]: unknown;
	};
	aud?: string;
	created_at?: string;
	app_metadata?: Record<string, unknown>;
}

export type User = MotionCapUser;

const firebaseConfig = {
	apiKey: import.meta.env.VITE_FIREBASE_API_KEY?.trim(),
	authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN?.trim(),
	projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim(),
	storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET?.trim(),
	messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID?.trim(),
	appId: import.meta.env.VITE_FIREBASE_APP_ID?.trim(),
};

export const motioncapAuthConfigured = Boolean(
	firebaseConfig.apiKey && firebaseConfig.projectId,
);

const firebaseApp = motioncapAuthConfigured
	? getApps().length > 0
		? getApp()
		: initializeApp(firebaseConfig)
	: null;

export const firebaseAuth = firebaseApp ? getAuth(firebaseApp) : null;

export interface MotionCapAuthClient {
	auth: {
		getUser: () => Promise<{ data: { user: MotionCapUser | null }; error: Error | null }>;
	};
	functions: {
		invoke: (
			functionName: string,
			options: { body: FormData; timeout?: number },
		) => Promise<{ data: any; error: any }>;
	};
}

export const motioncapAuth: MotionCapAuthClient | null = firebaseAuth
	? {
			auth: {
				getUser: async () => {
					const user = firebaseAuth.currentUser;
					if (!user) return { data: { user: null }, error: new Error("Not signed in") };
					return { data: { user: adaptFirebaseUser(user) }, error: null };
				},
			},
			functions: {
				invoke: async (functionName: string, options: { body: FormData; timeout?: number }) => {
					const token = await firebaseAuth.currentUser?.getIdToken();
					const functionsUrl = import.meta.env.VITE_FEEDBACK_ENDPOINT_URL || "";
					if (!functionsUrl) {
						return { data: { success: true }, error: null };
					}
					const res = await fetch(`${functionsUrl}/${functionName}`, {
						method: "POST",
						headers: token ? { Authorization: `Bearer ${token}` } : {},
						body: options.body,
						signal: options.timeout ? AbortSignal.timeout(options.timeout) : undefined,
					});
					if (!res.ok) {
						return { data: null, error: { context: res } };
					}
					const data = await res.json();
					return { data, error: null };
				},
			},
	  }
	: null;

export function adaptFirebaseUser(fbUser: FirebaseUser): MotionCapUser {
	const name = fbUser.displayName || fbUser.email?.split("@")[0] || "User";
	return {
		id: fbUser.uid,
		email: fbUser.email,
		displayName: fbUser.displayName,
		photoURL: fbUser.photoURL,
		user_metadata: {
			full_name: name,
			name,
			avatar_url: fbUser.photoURL || undefined,
		},
		created_at: fbUser.metadata.creationTime,
		app_metadata: {},
	};
}

export async function getCurrentUser(): Promise<MotionCapUser | null> {
	if (hasDemoSession()) return demoUser;
	if (!firebaseAuth?.currentUser) return null;
	return adaptFirebaseUser(firebaseAuth.currentUser);
}

export async function signInWithEmail(email: string, password: string): Promise<MotionCapUser> {
	if (demoLoginEnabled && email.toLowerCase() === "test@email.com") {
		if (password !== "1234") throw new Error("Incorrect email or password.");
		setDemoSession(true);
		return demoUser;
	}
	if (!firebaseAuth) {
		throw new Error(
			"MotionCap Firebase Auth is not configured. Add the Firebase API key and Project ID to your environment.",
		);
	}
	try {
		const credential = await signInWithEmailAndPassword(firebaseAuth, email, password);
		return adaptFirebaseUser(credential.user);
	} catch (error: any) {
		const code = error?.code;
		if (code === "auth/user-not-found" || code === "auth/invalid-credential") {
			// Try registering new account if user does not exist
			try {
				const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
				return adaptFirebaseUser(credential.user);
			} catch (signupError: any) {
				if (signupError?.code === "auth/email-already-in-use") {
					throw new Error("Incorrect email or password.");
				}
				if (signupError?.code === "auth/weak-password") {
					throw new Error("Password should be at least 6 characters.");
				}
				throw signupError;
			}
		}
		if (code === "auth/wrong-password") {
			throw new Error("Incorrect email or password.");
		}
		if (code === "auth/invalid-email") {
			throw new Error("Invalid email address.");
		}
		if (code === "auth/weak-password") {
			throw new Error("Password must be at least 6 characters.");
		}
		throw error;
	}
}

export async function sendPasswordReset(email: string): Promise<void> {
	if (!firebaseAuth) {
		throw new Error("MotionCap Firebase Auth is not configured.");
	}
	await sendPasswordResetEmail(firebaseAuth, email);
}

export async function signInWithSocial(provider: "google" | "azure"): Promise<void> {
	if (!firebaseAuth) {
		throw new Error("MotionCap Firebase Auth is not configured.");
	}
	const authProvider =
		provider === "google"
			? new GoogleAuthProvider()
			: new OAuthProvider("microsoft.com");

	await signInWithPopup(firebaseAuth, authProvider);
}

export async function signInWithSaml(_email: string): Promise<void> {
	if (!firebaseAuth) {
		throw new Error("MotionCap Firebase Auth is not configured.");
	}
	const provider = new OAuthProvider("microsoft.com");
	await signInWithPopup(firebaseAuth, provider);
}

export async function signOutMotionCap(): Promise<void> {
	if (hasDemoSession()) {
		setDemoSession(false);
		return;
	}
	if (firebaseAuth) {
		await fbSignOut(firebaseAuth);
	}
}

export async function completeAuthCallback(_url: string): Promise<void> {
	// Firebase automatically resolves auth tokens in popup/redirect flows
}
