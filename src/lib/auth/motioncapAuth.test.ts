import { afterEach, beforeEach, expect, it, vi } from "vitest";

const store = new Map<string, string>();
const localStorageMock = {
	getItem: (k: string) => store.get(k) ?? null,
	setItem: (k: string, v: string) => store.set(k, v),
	removeItem: (k: string) => store.delete(k),
	clear: () => store.clear(),
};

beforeEach(() => {
	vi.resetModules();
	store.clear();
	vi.stubGlobal("localStorage", localStorageMock);
});

afterEach(() => {
	vi.unstubAllEnvs();
	vi.unstubAllGlobals();
});

it("signs in with demo user when test@email.com and 1234 are used", async () => {
	const { signInWithEmail } = await import("./motioncapAuth");
	const user = await signInWithEmail("test@email.com", "1234");
	expect(user.email).toBe("test@email.com");
});

it("rejects demo user with wrong password", async () => {
	const { signInWithEmail } = await import("./motioncapAuth");
	await expect(signInWithEmail("test@email.com", "wrong")).rejects.toThrow(
		"Incorrect email or password.",
	);
});

it("signs in and stores session for standard user credentials", async () => {
	const mockFetch = vi.fn().mockResolvedValue({
		ok: true,
		json: async () => ({
			success: true,
			token: "catalyst_mock_jwt_123",
			user: {
				id: "zc_user_456",
				email: "dev@zylker.com",
				displayName: "Dev Zylker",
				photoURL: "https://example.com/avatar.png",
				user_metadata: {
					full_name: "Dev Zylker",
					name: "Dev Zylker",
					provider: "zoho_catalyst",
				},
				created_at: "2026-10-15T00:00:00.000Z",
			},
		}),
	});
	vi.stubGlobal("fetch", mockFetch);

	const { signInWithEmail, getCurrentUser, getStoredAccessToken } = await import("./motioncapAuth");
	const user = await signInWithEmail("dev@zylker.com", "password123");

	expect(user.id).toBe("zc_user_456");
	expect(user.email).toBe("dev@zylker.com");
	expect(getStoredAccessToken()).toBe("catalyst_mock_jwt_123");

	const current = await getCurrentUser();
	expect(current?.id).toBe("zc_user_456");
});

it("sends password reset to Zoho Catalyst backend", async () => {
	const mockFetch = vi.fn().mockResolvedValue({
		ok: true,
		json: async () => ({ success: true, message: "Reset link sent" }),
	});
	vi.stubGlobal("fetch", mockFetch);

	const { sendPasswordReset } = await import("./motioncapAuth");
	await expect(sendPasswordReset("dev@zylker.com")).resolves.toBeUndefined();
	expect(mockFetch).toHaveBeenCalled();
});

it("clears stored session on signOutMotionCap", async () => {
	const { signInWithEmail, signOutMotionCap, getCurrentUser, getStoredAccessToken } =
		await import("./motioncapAuth");

	const mockFetch = vi.fn().mockResolvedValue({
		ok: true,
		json: async () => ({
			success: true,
			token: "tok_abc",
			user: { id: "zc_1", email: "test@zylker.com", displayName: "Tester" },
		}),
	});
	vi.stubGlobal("fetch", mockFetch);

	await signInWithEmail("test@zylker.com", "secure123");
	expect(getStoredAccessToken()).toBe("tok_abc");

	await signOutMotionCap();
	expect(getStoredAccessToken()).toBeUndefined();
	const userAfter = await getCurrentUser();
	expect(userAfter).toBeNull();
});

it("completes deep-link auth callback motioncap://auth-callback", async () => {
	const { completeAuthCallback, getCurrentUser, getStoredAccessToken } =
		await import("./motioncapAuth");

	await completeAuthCallback(
		"motioncap://auth-callback?token=jwt_deep_link_999&email=founder@motioncap.app&name=Founder",
	);

	expect(getStoredAccessToken()).toBe("jwt_deep_link_999");
	const user = await getCurrentUser();
	expect(user?.email).toBe("founder@motioncap.app");
	expect(user?.displayName).toBe("Founder");
});
