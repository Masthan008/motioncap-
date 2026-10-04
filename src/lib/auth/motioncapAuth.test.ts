import { afterEach, beforeEach, expect, it, vi } from "vitest";

const mockSignIn = vi.hoisted(() => vi.fn());
const mockCreateUser = vi.hoisted(() => vi.fn());
const mockPasswordReset = vi.hoisted(() => vi.fn());
const mockSignOut = vi.hoisted(() => vi.fn());
const mockSignInWithPopup = vi.hoisted(() => vi.fn());

vi.mock("firebase/app", () => ({
	initializeApp: vi.fn(() => ({})),
	getApps: vi.fn(() => [{}]),
	getApp: vi.fn(() => ({})),
}));

vi.mock("firebase/auth", () => ({
	getAuth: vi.fn(() => ({ currentUser: null })),
	signInWithEmailAndPassword: mockSignIn,
	createUserWithEmailAndPassword: mockCreateUser,
	sendPasswordResetEmail: mockPasswordReset,
	signOut: mockSignOut,
	signInWithPopup: mockSignInWithPopup,
	GoogleAuthProvider: vi.fn(),
	OAuthProvider: vi.fn((providerId: string) => ({ providerId })),
}));

beforeEach(() => {
	vi.resetModules();
	mockSignIn.mockClear();
	mockCreateUser.mockClear();
	mockPasswordReset.mockClear();
	mockSignOut.mockClear();
	mockSignInWithPopup.mockClear();
	vi.stubEnv("VITE_FIREBASE_API_KEY", "mock-api-key");
	vi.stubEnv("VITE_FIREBASE_PROJECT_ID", "mock-project-id");
});

afterEach(() => {
	vi.unstubAllEnvs();
	vi.unstubAllGlobals();
});

it("signs in with demo user when test@email.com and 1234 are used", async () => {
	const { signInWithEmail } = await import("./motioncapAuth");
	const user = await signInWithEmail("test@email.com", "1234");
	expect(user.email).toBe("test@email.com");
	expect(mockSignIn).not.toHaveBeenCalled();
});

it("rejects demo user with wrong password", async () => {
	const { signInWithEmail } = await import("./motioncapAuth");
	await expect(signInWithEmail("test@email.com", "wrong")).rejects.toThrow(
		"Incorrect email or password.",
	);
});

it("calls Firebase signInWithEmailAndPassword for standard credentials", async () => {
	mockSignIn.mockResolvedValueOnce({
		user: {
			uid: "fb-123",
			email: "user@example.com",
			displayName: "Test User",
			photoURL: "https://example.com/avatar.png",
			metadata: { creationTime: "2026-10-01" },
		},
	});
	const { signInWithEmail } = await import("./motioncapAuth");
	const user = await signInWithEmail("user@example.com", "password123");
	expect(mockSignIn).toHaveBeenCalledWith(expect.anything(), "user@example.com", "password123");
	expect(user.id).toBe("fb-123");
	expect(user.displayName).toBe("Test User");
	expect(user.user_metadata?.avatar_url).toBe("https://example.com/avatar.png");
});

it("attempts registration if user is not found on sign in", async () => {
	mockSignIn.mockRejectedValueOnce({ code: "auth/user-not-found" });
	mockCreateUser.mockResolvedValueOnce({
		user: {
			uid: "new-user-456",
			email: "new@example.com",
			displayName: "New User",
			metadata: {},
		},
	});
	const { signInWithEmail } = await import("./motioncapAuth");
	const user = await signInWithEmail("new@example.com", "password123");
	expect(mockCreateUser).toHaveBeenCalledWith(expect.anything(), "new@example.com", "password123");
	expect(user.id).toBe("new-user-456");
});

it("sends password reset email via Firebase Auth", async () => {
	mockPasswordReset.mockResolvedValueOnce(undefined);
	const { sendPasswordReset } = await import("./motioncapAuth");
	await sendPasswordReset("user@example.com");
	expect(mockPasswordReset).toHaveBeenCalledWith(expect.anything(), "user@example.com");
});

it("signs in with Google popup", async () => {
	mockSignInWithPopup.mockResolvedValueOnce({});
	const { signInWithSocial } = await import("./motioncapAuth");
	await signInWithSocial("google");
	expect(mockSignInWithPopup).toHaveBeenCalled();
});

it("signs out from Firebase", async () => {
	mockSignOut.mockResolvedValueOnce(undefined);
	const { signOutMotionCap } = await import("./motioncapAuth");
	await signOutMotionCap();
	expect(mockSignOut).toHaveBeenCalled();
});
