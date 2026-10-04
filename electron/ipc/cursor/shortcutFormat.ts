/**
 * Keycode mappings based on uiohook-napi / libuiohook scancodes.
 */
export const UIOHOOK_KEY_NAMES: Record<number, string> = {
	1: "Esc",
	2: "1",
	3: "2",
	4: "3",
	5: "4",
	6: "5",
	7: "6",
	8: "7",
	9: "8",
	10: "9",
	11: "0",
	12: "-",
	13: "=",
	14: "Backspace",
	15: "Tab",
	16: "Q",
	17: "W",
	18: "E",
	19: "R",
	20: "T",
	21: "Y",
	22: "U",
	23: "I",
	24: "O",
	25: "P",
	26: "[",
	27: "]",
	28: "Enter",
	30: "A",
	31: "S",
	32: "D",
	33: "F",
	34: "G",
	35: "H",
	36: "J",
	37: "K",
	38: "L",
	39: ";",
	40: "'",
	41: "`",
	43: "\\",
	44: "Z",
	45: "X",
	46: "C",
	47: "V",
	48: "B",
	49: "N",
	50: "M",
	51: ",",
	52: ".",
	53: "/",
	57: "Space",
	58: "CapsLock",
	59: "F1",
	60: "F2",
	61: "F3",
	62: "F4",
	63: "F5",
	64: "F6",
	65: "F7",
	66: "F8",
	67: "F9",
	68: "F10",
	87: "F11",
	88: "F12",
	3655: "Home",
	3657: "PageUp",
	3663: "End",
	3665: "PageDown",
	3666: "Insert",
	3667: "Delete",
	57416: "↑",
	57419: "←",
	57421: "→",
	57424: "↓",
};

/** Keycodes that represent modifier keys themselves (Ctrl, Alt, Shift, Meta) */
const MODIFIER_KEYCODES = new Set([
	29, // Ctrl
	3613, // CtrlRight
	56, // Alt
	3640, // AltRight
	42, // Shift
	54, // ShiftRight
	3675, // Meta / Win / Cmd
	3676, // MetaRight
]);

/** Special standalone keys that are meaningful even without Ctrl/Cmd modifiers */
const STANDALONE_SHORTCUT_KEYS = new Set([
	1, // Esc
	59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 87, 88, // F1-F12
	3657, // PageUp
	3665, // PageDown
	3655, // Home
	3663, // End
	3666, // Insert
	3667, // Delete
]);

export interface HookKeyboardEventLike {
	altKey?: boolean;
	ctrlKey?: boolean;
	metaKey?: boolean;
	shiftKey?: boolean;
	keycode: number;
}

/**
 * Formats a raw uiohook keyboard event into a user-friendly shortcut string.
 * Returns null if the event is not a shortcut (e.g. typing regular text without modifiers,
 * or pressing a modifier key alone).
 */
export function formatShortcutFromEvent(
	event: HookKeyboardEventLike,
	platform: NodeJS.Platform = process.platform,
): string | null {
	if (!event || typeof event.keycode !== "number") {
		return null;
	}

	// Ignore if the key being pressed is just a modifier key by itself
	if (MODIFIER_KEYCODES.has(event.keycode)) {
		return null;
	}

	const keyName = UIOHOOK_KEY_NAMES[event.keycode];
	if (!keyName) {
		return null;
	}

	const hasCtrl = Boolean(event.ctrlKey);
	const hasAlt = Boolean(event.altKey);
	const hasMeta = Boolean(event.metaKey);
	const hasShift = Boolean(event.shiftKey);

	const hasModifier = hasCtrl || hasAlt || hasMeta;
	const isStandaloneKey = STANDALONE_SHORTCUT_KEYS.has(event.keycode);

	// Only format if a primary modifier (Ctrl, Alt, Meta) is pressed,
	// OR Shift is pressed with a navigation/function key, OR it's a standalone function/navigation key.
	if (!hasModifier && !isStandaloneKey && !(hasShift && (event.keycode === 15 || event.keycode === 28))) {
		return null;
	}

	const isMac = platform === "darwin";

	if (isMac) {
		const parts: string[] = [];
		if (hasCtrl) parts.push("⌃");
		if (hasAlt) parts.push("⌥");
		if (hasShift) parts.push("⇧");
		if (hasMeta) parts.push("⌘");
		parts.push(keyName);
		return parts.join("");
	}

	const parts: string[] = [];
	if (hasCtrl) parts.push("Ctrl");
	if (hasAlt) parts.push("Alt");
	if (hasShift) parts.push("Shift");
	if (hasMeta) parts.push("Win");
	parts.push(keyName);
	return parts.join(" + ");
}
