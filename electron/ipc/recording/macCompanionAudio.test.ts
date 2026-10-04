import { describe, expect, it } from "vitest";

import { getFinalMacCompanionAudioPath } from "./macCompanionAudio";

describe("mac companion audio paths", () => {
	it("preserves the helper's AAC container extension", () => {
		expect(
			getFinalMacCompanionAudioPath(
				"/Users/egg/MotionCap/recording-1.mp4",
				"/Users/egg/MotionCap/recording-1.mic.m4a",
				"mic",
			),
		).toBe("/Users/egg/MotionCap/recording-1.mic.m4a");
	});

	it("preserves legacy sidecar extensions instead of renaming bytes", () => {
		expect(
			getFinalMacCompanionAudioPath(
				"/Users/egg/MotionCap/recording-1.mp4",
				"/tmp/motioncap-native.system.webm",
				"system",
			),
		).toBe("/Users/egg/MotionCap/recording-1.system.webm");
	});

	it("keeps dotted directories when the video path has no extension", () => {
		expect(
			getFinalMacCompanionAudioPath(
				"/Users/egg/MotionCap.videos/recording-1",
				"/tmp/motioncap-native.mic.m4a",
				"mic",
			),
		).toBe("/Users/egg/MotionCap.videos/recording-1.mic.m4a");
	});
});
