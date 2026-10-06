import {
	ArrowClockwiseIcon,
	CaretUpIcon,
	House,
	DotsThreeVerticalIcon,
	MicrophoneIcon,
	MicrophoneSlashIcon,
	MinusIcon,
	MonitorIcon,
	TimerIcon,
	VideoCameraIcon,
	VideoCameraSlashIcon,
	XIcon,
} from "@/components/ui/icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/toast";
import { useScopedT } from "../../contexts/I18nContext";
import { useMicrophoneDevices } from "../../hooks/useMicrophoneDevices";
import { useScreenRecorder } from "../../hooks/useScreenRecorder";
import { useVideoDevices } from "../../hooks/useVideoDevices";
import { Button } from "../ui/button";
import { HudInteractionContext } from "./contexts/HudInteractionContext";
import { canToggleFloatingWebcamPreview } from "./floatingWebcamPreview";
import { useHudBarDrag } from "./hooks/useHudBarDrag";
import { useLaunchHudInteractionState } from "./hooks/useLaunchHudInteractionState";
import { useLaunchWindowActions } from "./hooks/useLaunchWindowActions";
import { useLaunchWindowSystemState } from "./hooks/useLaunchWindowSystemState";
import { useRecordingTimer } from "./hooks/useRecordingTimer";
import { useWebcamPreviewOverlay } from "./hooks/useWebcamPreviewOverlay";
import styles from "./LaunchWindow.module.css";
import { MarqueeText } from "./MarqueeText";
import { CountdownPopover } from "./popovers/CountdownPopover";
import { AutoStopTimerPopover } from "./popovers/AutoStopTimerPopover";
import { formatAutoStopPresetLabel, shouldAutoStop } from "./autoStopTimer";
import {
	LaunchPopoverCoordinatorProvider,
	useLaunchPopoverCoordinator,
} from "./popovers/LaunchPopoverCoordinator";
import { MicPopover } from "./popovers/MicPopover";
import { SourcePopover } from "./popovers/SourcePopover";
import { WebcamPopover } from "./popovers/WebcamPopover";
import { RecordingControls } from "./RecordingControls";
import { InteractiveRegionSelector } from "./InteractiveRegionSelector";
import { LiquidWebcamPreview } from "./LiquidWebcamPreview";
import { Crop } from "@/components/ui/icons";
import { LiquidDroplet } from "./LiquidDroplet";

export function LaunchWindow() {
	return (
		<LaunchPopoverCoordinatorProvider>
			<LaunchWindowContent />
		</LaunchPopoverCoordinatorProvider>
	);
}

function LaunchWindowContent() {
	const t = useScopedT("launch");
	const { openId, requestOpen } = useLaunchPopoverCoordinator();

	const {
		recording,
		paused,
		finalizing,
		countdownActive,
		toggleRecording,
		pauseRecording,
		resumeRecording,
		cancelRecording,
		microphoneEnabled,
		setMicrophoneEnabled,
		microphoneDeviceId,
		setMicrophoneDeviceId,
		systemAudioEnabled,
		setSystemAudioEnabled,
		webcamEnabled,
		setWebcamEnabled,
		webcamDeviceId,
		setWebcamDeviceId,
		countdownDelay,
		setCountdownDelay,
		preparePermissions,
	} = useScreenRecorder();

	const { elapsed, formatTime } = useRecordingTimer(recording, paused);
	const [autoStopLimitSeconds, setAutoStopLimitSeconds] = useState(0);
	const hudContentRef = useRef<HTMLDivElement>(null);
	const hudBarRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (recording && shouldAutoStop(elapsed, autoStopLimitSeconds)) {
			setAutoStopLimitSeconds(0);
			toggleRecording();
			toast.info(t("recording.autoStopStopped", "Recording stopped by auto-stop timer"));
		}
	}, [recording, elapsed, autoStopLimitSeconds, toggleRecording, t]);

	const {
		selectedSource,
		hasSelectedSource,
		handleSourceSelect,
		syncSelectedSource,
		isRegionSelectorOpen,
		setIsRegionSelectorOpen,
		handleConfirmRegion,
	} = useLaunchWindowActions();

	const showWebcamControls = webcamEnabled && !recording;
	const { devices, selectedDeviceId, setSelectedDeviceId } = useMicrophoneDevices(
		microphoneEnabled || openId === "mic",
		microphoneDeviceId,
	);
	const {
		devices: videoDevices,
		selectedDeviceId: selectedVideoDeviceId,
		setSelectedDeviceId: setSelectedVideoDeviceId,
	} = useVideoDevices(webcamEnabled || openId === "webcam");

	const { hudOverlayMousePassthroughSupported, platform } =
		useLaunchWindowSystemState(preparePermissions);

	useEffect(() => {
		if (!selectedDeviceId) {
			return;
		}

		setMicrophoneDeviceId(selectedDeviceId === "default" ? undefined : selectedDeviceId);
	}, [selectedDeviceId, setMicrophoneDeviceId]);

	useEffect(() => {
		if (selectedVideoDeviceId && selectedVideoDeviceId !== "default") {
			setWebcamDeviceId(selectedVideoDeviceId);
		}
	}, [selectedVideoDeviceId, setWebcamDeviceId]);

	const {
		showFloatingWebcamPreview,
		setShowFloatingWebcamPreview,
		showRecordingWebcamPreview,
		webcamPreviewOffset,
		recordingWebcamPreviewContainerRef,
		isWebcamPreviewDraggingRef,
		webcamPreviewDragStartRef,
		handleWebcamPreviewPointerDown,
		handleWebcamPreviewPointerMove,
		handleWebcamPreviewPointerUp,
		setWebcamPreviewNode,
		setRecordingWebcamPreviewNode,
	} = useWebcamPreviewOverlay({
		webcamEnabled,
		webcamDeviceId,
		showWebcamControls,
		webcamPopoverOpen: openId === "webcam",
		hudOverlayMousePassthroughSupported,
	});

	useEffect(() => {
		window.electronAPI?.hudOverlaySetWebcamPreviewVisible?.(showRecordingWebcamPreview);
	}, [showRecordingWebcamPreview]);

	useEffect(() => {
		return () => {
			window.electronAPI?.hudOverlaySetWebcamPreviewVisible?.(false);
		};
	}, []);

	const {
		recordingHudOffset,
		isHudDragging,
		hudBarTransformRef,
		isHudDraggingRef,
		handleHudBarPointerDown,
		handleHudBarPointerMove,
		handleHudBarPointerUp,
	} = useHudBarDrag({
		hudContentRef,
		hudBarRef,
		recordingWebcamPreviewContainerRef,
	});

	const { handleHudMouseEnter, handleHudMouseLeave, beginInteractiveHudAction } =
		useLaunchHudInteractionState({
			openId,
			isHudDraggingRef,
			isWebcamPreviewDraggingRef,
			webcamPreviewDragStartRef,
		});

	useEffect(() => {
		let mounted = true;

		void window.electronAPI.getSelectedSource().then((source) => {
			if (mounted) syncSelectedSource(source);
		});

		const cleanup = window.electronAPI.onSelectedSourceChanged((source) => {
			if (mounted) syncSelectedSource(source);
		});

		return () => {
			mounted = false;
			cleanup?.();
		};
	}, [syncSelectedSource]);

	const hudStateTransition = {
		duration: 0.24,
		ease: [0.22, 1, 0.36, 1] as const,
	};

	const openHome = () => {
		localStorage.setItem("motioncap.open-dashboard", String(Date.now()));
		void window.electronAPI.showProjectDashboard();
	};
	const homeButton = (
		<LiquidDroplet glow="glass">
			<Button
				variant="ghost"
				size="icon"
				iconSize="lg"
				aria-label={t("recording.home")}
				title={t("recording.home")}
				onClick={openHome}
			>
				<House weight="fill" className="size-5" />
			</Button>
		</LiquidDroplet>
	);

	const recordingControls = (
		<RecordingControls
			onHome={openHome}
			paused={paused}
			microphoneEnabled={microphoneEnabled}
			elapsed={elapsed}
			onPauseResume={paused ? resumeRecording : pauseRecording}
			onStopRecording={toggleRecording}
			onHideHud={() => window.electronAPI?.hudOverlayHide?.()}
			onCancelRecording={cancelRecording}
			formatTime={formatTime}
			autoStopLimitSeconds={autoStopLimitSeconds}
			onSelectAutoStopSeconds={setAutoStopLimitSeconds}
		/>
	);

	const idleControls = (
		<>
			<LiquidDroplet glow="violet">
				<div
					className={`${styles.liquidWatermark} ${styles.electronNoDrag} hidden sm:flex cursor-pointer`}
					title="MotionCap Studio • Click to open Studio Tour"
					onClick={() => window.dispatchEvent(new CustomEvent("motioncap:open-onboarding"))}
					role="button"
					tabIndex={0}
					onKeyDown={(e) => {
						if (e.key === "Enter" || e.key === " ") {
							window.dispatchEvent(new CustomEvent("motioncap:open-onboarding"));
						}
					}}
				>
					<div className={styles.watermarkDropletOrb}>
						<span className={styles.watermarkDropletHighlight} />
					</div>
					<div className={styles.watermarkTextGroup}>
						<span className={styles.watermarkBrand}>MotionCap</span>
						<span className={styles.watermarkPill}>STUDIO</span>
					</div>
				</div>
			</LiquidDroplet>
			<Separator orientation="vertical" className="mx-[4px] h-6 self-center hidden sm:block" />

			{platform !== "linux" && (
				<>
					<SourcePopover
						selectedSource={selectedSource}
						onSourceSelect={handleSourceSelect}
						onOpenRegionSelector={() => setIsRegionSelectorOpen(true)}
						onOpen={beginInteractiveHudAction}
						trigger={
							<LiquidDroplet glow="violet">
								<Button
									variant="ghost"
									size="lg"
									className={` ${styles.electronNoDrag} group gap-2 px-3 min-w-0 max-w-[180px] shrink-0  ${openId === "sources" ? "border-[var(--launch-border-strong)] bg-[var(--launch-hover)]" : ""} `}
									title={selectedSource}
								>
									{selectedSource.startsWith("Region (") ? (
										<Crop className="size-5 shrink-0 text-violet-600" />
									) : (
										<MonitorIcon
											weight={openId === "sources" ? "fill" : "regular"}
											size={18}
											className="size-5 shrink-0 text-slate-800"
										/>
									)}
									<div className="flex-1 min-w-0 overflow-hidden font-medium text-slate-900">
										<MarqueeText text={selectedSource} />
									</div>
									<CaretUpIcon
										size={10}
										className={`text-slate-500 ml-0.5 shrink-0 transition-transform duration-200 ${
											openId === "sources" ? "" : "rotate-180"
										}`}
									/>
								</Button>
							</LiquidDroplet>
						}
					/>

					<Separator orientation="vertical" className="mx-[5px] h-6 self-center" />
				</>
			)}

			<MicPopover
				disabled={recording}
				systemAudioEnabled={systemAudioEnabled}
				onToggleSystemAudio={() => setSystemAudioEnabled(!systemAudioEnabled)}
				microphoneEnabled={microphoneEnabled}
				onDisableMicrophone={() => setMicrophoneEnabled(false)}
				devices={devices}
				microphoneDeviceId={microphoneDeviceId}
				selectedDeviceId={selectedDeviceId}
				onSelectDevice={(deviceId) => {
					setMicrophoneEnabled(true);
					setSelectedDeviceId(deviceId);
					setMicrophoneDeviceId(deviceId === "default" ? undefined : deviceId);
				}}
				trigger={
					<LiquidDroplet glow={microphoneEnabled ? "violet" : "glass"}>
						<Button
							variant="ghost"
							size="icon"
							iconSize="lg"
							title={
								microphoneEnabled
									? t("recording.disableMicrophone")
									: t("recording.enableMicrophone")
							}
							className={microphoneEnabled ? "text-accent" : ""}
						>
							{microphoneEnabled ? (
								<div className="flex items-center">
									<MicrophoneIcon
										weight="fill"
										className="size-5"
										size={18}
									/>
									<span className={styles.soundwaveContainer}>
										<span className={styles.soundwaveBar} />
										<span className={styles.soundwaveBar} />
										<span className={styles.soundwaveBar} />
									</span>
								</div>
							) : (
								<MicrophoneSlashIcon className="size-5" />
							)}
						</Button>
					</LiquidDroplet>
				}
			/>

			<WebcamPopover
				disabled={recording}
				webcamEnabled={webcamEnabled}
				onDisableWebcam={() => setWebcamEnabled(false)}
				canToggleFloatingPreview={canToggleFloatingWebcamPreview(
					hudOverlayMousePassthroughSupported,
				)}
				showFloatingWebcamPreview={showFloatingWebcamPreview}
				onToggleFloatingPreview={() => setShowFloatingWebcamPreview((current) => !current)}
				showWebcamControls={showWebcamControls}
				setWebcamPreviewNode={setWebcamPreviewNode}
				videoDevices={videoDevices}
				webcamDeviceId={webcamDeviceId}
				selectedVideoDeviceId={selectedVideoDeviceId}
				onSelectVideoDevice={(deviceId) => {
					setWebcamEnabled(true);
					setSelectedVideoDeviceId(deviceId);
					setWebcamDeviceId(deviceId);
				}}
				trigger={
					<LiquidDroplet glow={webcamEnabled ? "cyan" : "glass"}>
						<Button
							variant="ghost"
							size="icon"
							iconSize="lg"
							title={
								webcamEnabled
									? t("recording.disableWebcam")
									: t("recording.enableWebcam")
							}
							className={webcamEnabled ? "text-accent" : ""}
						>
							{webcamEnabled ? (
								<VideoCameraIcon
									weight={webcamEnabled ? "fill" : "regular"}
									className="size-5"
									size={18}
								/>
							) : (
								<VideoCameraSlashIcon className="size-5" />
							)}
						</Button>
					</LiquidDroplet>
				}
			/>

			<CountdownPopover
				countdownDelay={countdownDelay}
				onSelectDelay={setCountdownDelay}
				trigger={
					<LiquidDroplet glow={countdownDelay > 0 ? "violet" : "glass"}>
						<Button
							variant="ghost"
							size="icon"
							iconSize="lg"
							title={t("recording.countdownDelay")}
							className={countdownDelay > 0 ? "text-accent" : ""}
						>
							<TimerIcon
								weight={openId === "countdown" ? "fill" : "regular"}
								className="size-5"
							/>
						</Button>
					</LiquidDroplet>
				}
			/>

			<AutoStopTimerPopover
				autoStopSeconds={autoStopLimitSeconds}
				onSelectAutoStop={setAutoStopLimitSeconds}
				trigger={
					<LiquidDroplet glow={autoStopLimitSeconds > 0 ? "violet" : "glass"}>
						<Button
							variant="ghost"
							size="icon"
							iconSize="lg"
							title={
								autoStopLimitSeconds > 0
									? `${t("recording.autoStopTimer", "Auto-stop timer")}: ${formatAutoStopPresetLabel(autoStopLimitSeconds)}`
									: t("recording.autoStopTimer", "Auto-stop timer")
							}
							className={autoStopLimitSeconds > 0 ? "text-accent" : ""}
						>
							<TimerIcon
								weight={openId === "autoStop" || autoStopLimitSeconds > 0 ? "fill" : "regular"}
								className="size-5"
							/>
						</Button>
					</LiquidDroplet>
				}
			/>

			<LiquidDroplet glow="red">
				<Button
					type="button"
					variant="destructive"
					size="icon"
					className={`${styles.electronNoDrag} ${styles.liquidRecordButton}`}
					onClick={
						hasSelectedSource || platform === "linux"
							? toggleRecording
							: () => {
									beginInteractiveHudAction();
									requestOpen("sources");
								}
					}
					disabled={countdownActive}
					title={t("recording.record")}
				>
					<div className={styles.recDot} />
				</Button>
			</LiquidDroplet>

			<Separator orientation="vertical" className="mx-[5px] h-6 self-center" />

			{homeButton}

			<LiquidDroplet glow="glass">
				<Button
					variant="ghost"
					size="icon"
					iconSize="lg"
					onClick={() => window.electronAPI?.hudOverlayHide?.()}
					title={t("recording.hideHud")}
				>
					<MinusIcon className="size-5" />
				</Button>
			</LiquidDroplet>

			<LiquidDroplet glow="red">
				<Button
					variant="ghost"
					size="icon"
					iconSize="lg"
					onClick={() => window.electronAPI?.hudOverlayClose?.()}
					title={t("recording.closeApp")}
				>
					<XIcon className="size-5" />
				</Button>
			</LiquidDroplet>
		</>
	);

	const finalizingControls = (
		<div className={styles.finalizingState}>
			<ArrowClockwiseIcon size={15} className={styles.finalizingSpin} />
			<div className={styles.finalizingCopy}>
				<span>{t("recording.preparing", "Preparing recording")}</span>
				<small>{t("recording.preparingSubtitle", "Opening the editor in a moment")}</small>
			</div>
		</div>
	);

	const hudMode = finalizing ? "finalizing" : recording ? "recording" : "idle";
	const useNativeHudBarDrag =
		platform === "linux" || hudOverlayMousePassthroughSupported === false;
	const shouldAnimateHudLayout = !recording && !showRecordingWebcamPreview && !isHudDragging;

	return (
		<HudInteractionContext.Provider
			value={{ onMouseEnter: handleHudMouseEnter, onMouseLeave: handleHudMouseLeave }}
		>
			<div
				className="w-full flex justify-center bg-transparent overflow-visible items-end pb-5 pointer-events-none"
				style={{ height: "100vh" }}
			>
				<div
					ref={hudContentRef}
					className="flex items-center overflow-visible flex-col-reverse pointer-events-none"
				>
					<div className="flex flex-col items-center pointer-events-none p-2">
						<div
							ref={hudBarTransformRef}
							style={{
								transform: `translate3d(${recordingHudOffset.x}px, ${recordingHudOffset.y}px, 0)`,
							}}
						>
							<motion.div
								ref={hudBarRef}
								layout={shouldAnimateHudLayout}
								transition={hudStateTransition}
								className={`${styles.bar} launch-theme mb-2 pointer-events-auto`}
								onMouseEnter={handleHudMouseEnter}
								onMouseLeave={handleHudMouseLeave}
							>
								<div
									// Linux compositors and non-passthrough Windows fallback windows
									// need native window dragging; the JS drag path only translates
									// content inside the HUD window.
									className={`flex items-center px-0.5 cursor-grab active:cursor-grabbing ${
										useNativeHudBarDrag ? styles.electronDrag : ""
									}`}
									onPointerDown={handleHudBarPointerDown}
									onPointerMove={handleHudBarPointerMove}
									onPointerUp={handleHudBarPointerUp}
									onPointerCancel={handleHudBarPointerUp}
								>
									<DotsThreeVerticalIcon
										weight="fill"
										size={18}
										className="text-slate-400 hover:text-slate-600 transition-colors"
									/>
								</div>

								<div className={styles.barStateViewport}>
									<AnimatePresence initial={false} mode="wait">
										<motion.div
											key={hudMode}
											layout={shouldAnimateHudLayout}
											className={styles.barState}
											initial={{
												opacity: 0,
												y: 10,
												scale: 0.985,
												filter: "blur(8px)",
											}}
											animate={{
												opacity: 1,
												y: 0,
												scale: 1,
												filter: "blur(0px)",
											}}
											exit={{
												opacity: 0,
												y: -10,
												scale: 0.985,
												filter: "blur(6px)",
											}}
											transition={hudStateTransition}
										>
											{finalizing
												? finalizingControls
												: recording
													? recordingControls
													: idleControls}
										</motion.div>
									</AnimatePresence>
								</div>
							</motion.div>
						</div>
						{showRecordingWebcamPreview && (
							<LiquidWebcamPreview
								containerRef={recordingWebcamPreviewContainerRef}
								videoRef={setRecordingWebcamPreviewNode}
								offset={webcamPreviewOffset}
								onPointerDown={handleWebcamPreviewPointerDown}
								onPointerMove={handleWebcamPreviewPointerMove}
								onPointerUp={handleWebcamPreviewPointerUp}
								onMouseEnter={handleHudMouseEnter}
								onMouseLeave={handleHudMouseLeave}
								onClose={() => setShowFloatingWebcamPreview(false)}
							/>
						)}
					</div>
				</div>
			</div>
			<InteractiveRegionSelector
				open={isRegionSelectorOpen}
				onClose={() => setIsRegionSelectorOpen(false)}
				onConfirm={handleConfirmRegion}
			/>
		</HudInteractionContext.Provider>
	);
}
