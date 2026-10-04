import path from "node:path";
import { dialog, ipcMain } from "electron";
import { generateAutoCaptionsFromVideo } from "../captions/generate";
import {
	deleteWhisperSmallModel,
	downloadWhisperSmallModel,
	getWhisperSmallModelStatus,
	sendWhisperModelDownloadProgress,
} from "../captions/whisper";
import { getFfmpegBinaryPath } from "../ffmpeg/binary";
import { LEGACY_PROJECT_FILE_EXTENSIONS, PROJECT_FILE_EXTENSION } from "../constants";
import { hasProjectFileExtension, loadProjectFromPath } from "../project/manager";
import { setCurrentProjectPath } from "../state";
import { approveUserPath, getRecordingsDir, normalizeVideoSourcePath } from "../utils";

const VIDEO_FILE_EXTENSIONS = ["webm", "mp4", "mov", "avi", "mkv"];
const PROJECT_FILE_EXTENSIONS = [PROJECT_FILE_EXTENSION, ...LEGACY_PROJECT_FILE_EXTENSIONS];

type OpenVideoFilePickerOptions = {
	includeProjects?: boolean;
};

export function registerCaptionHandlers() {
	ipcMain.handle("open-video-file-picker", async (_, options?: OpenVideoFilePickerOptions) => {
		try {
			const includeProjects = Boolean(options?.includeProjects);
			const recordingsDir = await getRecordingsDir();
			const result = await dialog.showOpenDialog({
				title: includeProjects ? "Import Media or MotionCap Project" : "Select Video File",
				defaultPath: recordingsDir,
				filters: [
					...(includeProjects
						? [
								{
									name: "Media or MotionCap Projects",
									extensions: [
										...VIDEO_FILE_EXTENSIONS,
										...PROJECT_FILE_EXTENSIONS,
									],
								},
							]
						: []),
					{ name: "Video Files", extensions: VIDEO_FILE_EXTENSIONS },
					...(includeProjects
						? [{ name: "MotionCap Projects", extensions: PROJECT_FILE_EXTENSIONS }]
						: []),
					{ name: "All Files", extensions: ["*"] },
				],
				properties: ["openFile"],
			});

			if (result.canceled || result.filePaths.length === 0) {
				return { success: false, canceled: true };
			}

			const selectedPath = result.filePaths[0];

			if (includeProjects && hasProjectFileExtension(selectedPath)) {
				const projectResult = await loadProjectFromPath(selectedPath);
				return projectResult.success
					? { ...projectResult, kind: "project" }
					: projectResult;
			}

			approveUserPath(selectedPath);
			setCurrentProjectPath(null);
			return {
				success: true,
				kind: "media",
				path: selectedPath,
				extension: path.extname(selectedPath).replace(/^\./, "").toLowerCase(),
			};
		} catch (error) {
			console.error("Failed to open file picker:", error);
			return {
				success: false,
				message: "Failed to open file picker",
				error: String(error),
			};
		}
	});

	ipcMain.handle("open-audio-file-picker", async () => {
		try {
			const result = await dialog.showOpenDialog({
				title: "Select Audio File",
				filters: [
					{
						name: "Audio Files",
						extensions: ["mp3", "wav", "aac", "m4a", "flac", "ogg"],
					},
					{ name: "All Files", extensions: ["*"] },
				],
				properties: ["openFile"],
			});

			if (result.canceled || result.filePaths.length === 0) {
				return { success: false, canceled: true };
			}

			approveUserPath(result.filePaths[0]);
			return {
				success: true,
				path: result.filePaths[0],
			};
		} catch (error) {
			console.error("Failed to open audio file picker:", error);
			return {
				success: false,
				message: "Failed to open audio file picker",
				error: String(error),
			};
		}
	});

	ipcMain.handle("open-whisper-executable-picker", async () => {
		try {
			const result = await dialog.showOpenDialog({
				title: "Select Whisper Executable",
				filters: [
					{
						name: "Executables",
						extensions: process.platform === "win32" ? ["exe", "cmd", "bat"] : ["*"],
					},
					{ name: "All Files", extensions: ["*"] },
				],
				properties: ["openFile"],
			});

			if (result.canceled || result.filePaths.length === 0) {
				return { success: false, canceled: true };
			}

			approveUserPath(result.filePaths[0]);
			return { success: true, path: result.filePaths[0] };
		} catch (error) {
			console.error("Failed to open Whisper executable picker:", error);
			return { success: false, error: String(error) };
		}
	});

	ipcMain.handle("open-whisper-model-picker", async () => {
		try {
			const result = await dialog.showOpenDialog({
				title: "Select Whisper Model",
				filters: [
					{ name: "Whisper Models", extensions: ["bin"] },
					{ name: "All Files", extensions: ["*"] },
				],
				properties: ["openFile"],
			});

			if (result.canceled || result.filePaths.length === 0) {
				return { success: false, canceled: true };
			}

			approveUserPath(result.filePaths[0]);
			return { success: true, path: result.filePaths[0] };
		} catch (error) {
			console.error("Failed to open Whisper model picker:", error);
			return { success: false, error: String(error) };
		}
	});

	ipcMain.handle("get-whisper-small-model-status", async () => {
		try {
			return await getWhisperSmallModelStatus();
		} catch (error) {
			return { success: false, exists: false, path: null, error: String(error) };
		}
	});

	ipcMain.handle("download-whisper-small-model", async (event) => {
		try {
			const existing = await getWhisperSmallModelStatus();
			if (existing.exists) {
				sendWhisperModelDownloadProgress(event.sender, {
					status: "downloaded",
					progress: 100,
					path: existing.path,
				});
				return { success: true, path: existing.path, alreadyDownloaded: true };
			}

			const modelPath = await downloadWhisperSmallModel(event.sender);
			return { success: true, path: modelPath };
		} catch (error) {
			console.error("Failed to download Whisper small model:", error);
			return { success: false, error: String(error) };
		}
	});

	ipcMain.handle("delete-whisper-small-model", async (event) => {
		try {
			await deleteWhisperSmallModel();
			sendWhisperModelDownloadProgress(event.sender, {
				status: "idle",
				progress: 0,
				path: null,
			});
			return { success: true };
		} catch (error) {
			console.error("Failed to delete Whisper small model:", error);
			// Verify whether the file was actually removed despite the error
			const status = await getWhisperSmallModelStatus();
			if (!status.exists) {
				// File is gone — treat as success
				sendWhisperModelDownloadProgress(event.sender, {
					status: "idle",
					progress: 0,
					path: null,
				});
				return { success: true };
			}
			sendWhisperModelDownloadProgress(event.sender, {
				status: "error",
				progress: 0,
				path: null,
				error: String(error),
			});
			return { success: false, error: String(error) };
		}
	});

	ipcMain.handle(
		"generate-auto-captions",
		async (
			_,
			options: {
				videoPath: string;
				whisperExecutablePath: string;
				whisperModelPath: string;
				language?: string;
			},
		) => {
			try {
				const result = await generateAutoCaptionsFromVideo(options);
				return {
					success: true,
					cues: result.cues,
					message:
						result.audioSourceLabel === "recording"
							? `Generated ${result.cues.length} caption cues.`
							: `Generated ${result.cues.length} caption cues from the ${result.audioSourceLabel}.`,
				};
			} catch (error) {
				console.error("Failed to generate auto captions:", error);
				return {
					success: false,
					error: String(error),
					message:
						error instanceof Error ? error.message : "Failed to generate auto captions",
				};
			}
		},
	);

	ipcMain.handle(
		"detect-silence-intervals",
		async (
			_,
			options: {
				videoPath: string;
				/** Minimum silence duration in seconds to detect. */
				minSilenceDurationS?: number;
				/** Noise floor in dB — audio quieter than this is silence. */
				noiseFloorDb?: number;
			},
		) => {
			const { app: electronApp } = await import("electron");
			const fsPromises = await import("node:fs/promises");

			try {
				const ffmpegPath = getFfmpegBinaryPath();
				const videoPath = normalizeVideoSourcePath(options.videoPath);
				if (!videoPath) {
					return { success: false, error: "Missing video path.", intervals: [] };
				}

				const tempBase = path.join(
					electronApp.getPath("temp"),
					`motioncap-silence-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
				);
				const wavPath = `${tempBase}.wav`;

				try {
					// Extract audio using companion/recording candidates.
					const { extractCaptionAudioSource } = await import("../captions/generate");
					await extractCaptionAudioSource({
						videoPath,
						ffmpegPath,
						wavPath,
					});

					const noiseDb = options.noiseFloorDb ?? -30;
					const minDuration = options.minSilenceDurationS ?? 0.5;

					const { execFile: execFileNode } = await import("node:child_process");
					const { promisify: promisifyNode } = await import("node:util");
					const execFilePromise = promisifyNode(execFileNode);

					const { stderr } = await execFilePromise(
						ffmpegPath,
						[
							"-hide_banner",
							"-nostats",
							"-i",
							wavPath,
							"-af",
							`silencedetect=noise=${noiseDb}dB:d=${minDuration}`,
							"-f",
							"null",
							"-",
						],
						{ timeout: 5 * 60 * 1000, maxBuffer: 20 * 1024 * 1024 },
					);

					const { parseSilenceIntervals } = await import("../captions/silence");
					const intervals = parseSilenceIntervals(stderr ?? "");

					return { success: true, intervals };
				} finally {
					// Clean up the temporary WAV file.
					await fsPromises.unlink(wavPath).catch(() => {});
				}
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				const isNoAudio =
					message.includes("No audio was found") ||
					message.includes("matches no streams") ||
					message.includes("no audio stream");

				if (isNoAudio) {
					console.warn("[silence-detect] Recording has no audio stream to trim:", options.videoPath);
					return {
						success: false,
						noAudio: true,
						error: "No audio track found in this recording. Silence trimming requires audio.",
						intervals: [],
					};
				}

				console.error("Failed to detect silence intervals:", error);
				return {
					success: false,
					noAudio: false,
					error: "Silence detection could not analyze this recording.",
					details: message,
					intervals: [],
				};
			}
		},
	);
}
