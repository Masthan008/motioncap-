import type { User } from "./motioncapAuth";

// Temporary local UI account. Never creates a cloud session or cloud access token.
export const demoLoginEnabled = import.meta.env.DEV;
const key = "motioncap.demo-session";
const event = "motioncap-demo-session-changed";
export const demoUser: User = {
	id: "motioncap-local-demo",
	email: "test@email.com",
	aud: "local-demo",
	app_metadata: {},
	user_metadata: { full_name: "Test User" },
	created_at: "2026-09-23T00:00:00.000Z",
};
export function hasDemoSession() {
	return demoLoginEnabled && typeof window !== "undefined" && sessionStorage.getItem(key) === "1";
}
export function setDemoSession(active: boolean) {
	if (!demoLoginEnabled) return;
	if (active) sessionStorage.setItem(key, "1");
	else sessionStorage.removeItem(key);
	window.dispatchEvent(new Event(event));
}
export function subscribeDemoSession(listener: () => void) {
	window.addEventListener(event, listener);
	return () => window.removeEventListener(event, listener);
}
