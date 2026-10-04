import { describe, expect, it } from "vitest";
import { formatShortcutFromEvent, UIOHOOK_KEY_NAMES } from "./shortcutFormat";

describe("formatShortcutFromEvent", () => {
	it("returns null for non-shortcut keystrokes without modifiers", () => {
		// Typing 'A' (keycode 30) without modifiers
		expect(formatShortcutFromEvent({ keycode: 30 })).toBeNull();
		// Typing 'Space' (keycode 57) without modifiers
		expect(formatShortcutFromEvent({ keycode: 57 })).toBeNull();
	});

	it("returns null when only a modifier key is pressed", () => {
		// Ctrl keycode 29
		expect(formatShortcutFromEvent({ keycode: 29, ctrlKey: true })).toBeNull();
		// Shift keycode 42
		expect(formatShortcutFromEvent({ keycode: 42, shiftKey: true })).toBeNull();
		// Alt keycode 56
		expect(formatShortcutFromEvent({ keycode: 56, altKey: true })).toBeNull();
	});

	it("formats Windows/Linux shortcuts properly", () => {
		// Ctrl + K
		expect(
			formatShortcutFromEvent({ keycode: 37, ctrlKey: true }, "win32"),
		).toBe("Ctrl + K");

		// Ctrl + Shift + P
		expect(
			formatShortcutFromEvent({ keycode: 25, ctrlKey: true, shiftKey: true }, "win32"),
		).toBe("Ctrl + Shift + P");

		// Alt + Tab
		expect(
			formatShortcutFromEvent({ keycode: 15, altKey: true }, "linux"),
		).toBe("Alt + Tab");

		// Win + S
		expect(
			formatShortcutFromEvent({ keycode: 31, metaKey: true }, "win32"),
		).toBe("Win + S");
	});

	it("formats macOS shortcuts with native modifier symbols", () => {
		// Cmd + K
		expect(
			formatShortcutFromEvent({ keycode: 37, metaKey: true }, "darwin"),
		).toBe("⌘K");

		// Cmd + Shift + P
		expect(
			formatShortcutFromEvent({ keycode: 25, metaKey: true, shiftKey: true }, "darwin"),
		).toBe("⇧⌘P");

		// Option + Tab
		expect(
			formatShortcutFromEvent({ keycode: 15, altKey: true }, "darwin"),
		).toBe("⌥Tab");
	});

	it("formats standalone function and navigation keys", () => {
		expect(formatShortcutFromEvent({ keycode: 1 }, "win32")).toBe("Esc");
		expect(formatShortcutFromEvent({ keycode: 59 }, "win32")).toBe("F1");
		expect(formatShortcutFromEvent({ keycode: 63 }, "darwin")).toBe("F5");
		expect(formatShortcutFromEvent({ keycode: 3667 }, "win32")).toBe("Delete");
	});
});
