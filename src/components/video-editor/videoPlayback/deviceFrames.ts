export type DeviceFrameStyle =
	| "none"
	| "macos-dark"
	| "macos-light"
	| "browser-dark"
	| "browser-light";

export const DEFAULT_DEVICE_FRAME_STYLE: DeviceFrameStyle = "none";

export interface DeviceFrameInsets {
	top: number;
	right: number;
	bottom: number;
	left: number;
}

export interface DeviceFrameInfo {
	id: DeviceFrameStyle;
	label: string;
	insets: DeviceFrameInsets | null;
	isDark: boolean;
	hasTrafficLights: boolean;
	hasAddressBar: boolean;
	defaultTitle?: string;
	defaultUrl?: string;
}

export const DEVICE_FRAMES: Record<DeviceFrameStyle, DeviceFrameInfo> = {
	none: {
		id: "none",
		label: "None",
		insets: null,
		isDark: true,
		hasTrafficLights: false,
		hasAddressBar: false,
	},
	"macos-dark": {
		id: "macos-dark",
		label: "macOS Dark",
		insets: { top: 0.046, right: 0, bottom: 0, left: 0 },
		isDark: true,
		hasTrafficLights: true,
		hasAddressBar: false,
		defaultTitle: "MotionCap Window",
	},
	"macos-light": {
		id: "macos-light",
		label: "macOS Light",
		insets: { top: 0.046, right: 0, bottom: 0, left: 0 },
		isDark: false,
		hasTrafficLights: true,
		hasAddressBar: false,
		defaultTitle: "MotionCap Window",
	},
	"browser-dark": {
		id: "browser-dark",
		label: "Browser Dark",
		insets: { top: 0.072, right: 0, bottom: 0, left: 0 },
		isDark: true,
		hasTrafficLights: true,
		hasAddressBar: true,
		defaultUrl: "motioncap.app",
	},
	"browser-light": {
		id: "browser-light",
		label: "Browser Light",
		insets: { top: 0.072, right: 0, bottom: 0, left: 0 },
		isDark: false,
		hasTrafficLights: true,
		hasAddressBar: true,
		defaultUrl: "motioncap.app",
	},
};

export function normalizeDeviceFrameStyle(
	value: unknown,
	fallback: DeviceFrameStyle = DEFAULT_DEVICE_FRAME_STYLE,
): DeviceFrameStyle {
	if (
		value === "none" ||
		value === "macos-dark" ||
		value === "macos-light" ||
		value === "browser-dark" ||
		value === "browser-light"
	) {
		return value;
	}
	return fallback;
}

export function getDeviceFrameInsets(style: DeviceFrameStyle): DeviceFrameInsets | null {
	return DEVICE_FRAMES[style]?.insets || null;
}
