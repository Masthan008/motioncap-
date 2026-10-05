import {
	House,
	MicrophoneIcon,
	MicrophoneSlashIcon,
	MinusIcon,
	PauseIcon,
	PlayIcon,
	TimerIcon,
	XIcon,
} from "@/components/ui/icons";
import { useScopedT } from "@/contexts/I18nContext";
import { Button, Separator, Tooltip } from "@heroui/react";
import styles from "./LaunchWindow.module.css";
import { AutoStopTimerPopover } from "./popovers/AutoStopTimerPopover";
import { calculateAutoStopRemaining, formatRemainingCountdown } from "./autoStopTimer";
import { LiquidDroplet } from "./LiquidDroplet";

interface RecordingControlsProps {
	onHome: () => void;
	paused: boolean;
	microphoneEnabled: boolean;
	elapsed: number;
	onPauseResume: () => void;
	onStopRecording: () => void;
	onHideHud: () => void;
	onCancelRecording: () => void;
	formatTime: (seconds: number) => string;
	autoStopLimitSeconds?: number;
	onSelectAutoStopSeconds?: (seconds: number) => void;
}
export function RecordingControls({
	onHome,
	paused,
	microphoneEnabled,
	elapsed,
	onPauseResume,
	onStopRecording,
	onHideHud,
	onCancelRecording,
	formatTime,
	autoStopLimitSeconds = 0,
	onSelectAutoStopSeconds,
}: RecordingControlsProps) {
	const t = useScopedT("launch");
	const actionClass = `size-9 min-w-9 rounded-full ${styles.electronNoDrag}`;
	const remaining = calculateAutoStopRemaining(elapsed, autoStopLimitSeconds);

	return (
		<div role="group" aria-label="Recording controls" className="flex items-center gap-2">
			<LiquidDroplet glow="violet">
				<div
					className={`${styles.liquidWatermarkMini} ${styles.electronNoDrag} hidden md:flex`}
					title="MotionCap Studio"
				>
					<div className={styles.watermarkDropletOrb} style={{ width: 10, height: 10 }}>
						<span
							className={styles.watermarkDropletHighlight}
							style={{ width: 2.5, height: 2.5, top: 1.5, left: 2 }}
						/>
					</div>
					<span className={styles.watermarkBrandMini}>MotionCap</span>
				</div>
			</LiquidDroplet>

			<LiquidDroplet glow="glass">
				<Button
					isIconOnly
					variant="ghost"
					className={actionClass}
					aria-label={t("recording.home")}
					onPress={onHome}
				>
					<House weight="fill" className="size-4 text-slate-800" />
				</Button>
			</LiquidDroplet>

			<div
				className="flex items-center gap-2.5 px-2"
				role="status"
				aria-label={paused ? t("recording.paused") : t("recording.rec")}
			>
				<span
					className={`size-2.5 rounded-full ${paused ? "bg-amber-500 shadow-sm" : `bg-red-500 shadow-sm shadow-red-500/50 ${styles.recDotBlink}`}`}
				/>
				<span className="min-w-14 text-sm font-bold tabular-nums text-slate-900">
					{formatTime(elapsed)}
				</span>
				{paused && (
					<span className="text-xs font-semibold text-amber-700">{t("recording.paused")}</span>
				)}
				{autoStopLimitSeconds > 0 && remaining !== null && onSelectAutoStopSeconds && (
					<AutoStopTimerPopover
						autoStopSeconds={autoStopLimitSeconds}
						onSelectAutoStop={onSelectAutoStopSeconds}
						trigger={
							<button
								type="button"
								className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold tabular-nums border transition-colors cursor-pointer ${styles.electronNoDrag} ${
									remaining <= 10
										? "bg-red-500/15 border-red-500/30 text-red-700 animate-pulse"
										: remaining <= 60
											? "bg-amber-500/15 border-amber-500/30 text-amber-800"
											: "bg-slate-900/5 border-slate-900/10 text-slate-800 hover:bg-slate-900/10"
								}`}
								title={
									t("recording.autoStopRemaining", undefined, {
										time: formatRemainingCountdown(remaining),
									}) ?? `Auto-stop in ${formatRemainingCountdown(remaining)}`
								}
							>
								<TimerIcon
									size={12}
									className={remaining <= 60 ? "text-amber-700" : "text-slate-600"}
								/>
								<span>{formatRemainingCountdown(remaining)}</span>
							</button>
						}
					/>
				)}
			</div>
			<Tooltip>
				<LiquidDroplet glow="glass">
					<Button
						isIconOnly
						variant="ghost"
						isDisabled
						className={actionClass}
						aria-label={microphoneEnabled ? "Microphone on" : "Microphone off"}
					>
						{microphoneEnabled ? (
							<MicrophoneIcon weight="fill" className="size-4 text-violet-600" />
						) : (
							<MicrophoneSlashIcon className="size-4 text-slate-400" />
						)}
					</Button>
				</LiquidDroplet>
				<Tooltip.Content>{t("recording.micToggleDisabledTip")}</Tooltip.Content>
			</Tooltip>
			<Separator orientation="vertical" className="mx-1 h-5 self-center opacity-30" />
			<Tooltip>
				<LiquidDroplet glow="violet">
					<Button
						isIconOnly
						variant="ghost"
						className={actionClass}
						onPress={onPauseResume}
						aria-label={paused ? t("recording.resume") : t("recording.pause")}
					>
						{paused ? (
							<PlayIcon weight="fill" className="size-4 text-violet-600" />
						) : (
							<PauseIcon weight="fill" className="size-4 text-slate-800" />
						)}
					</Button>
				</LiquidDroplet>
				<Tooltip.Content>
					{paused ? t("recording.resume") : t("recording.pause")}
				</Tooltip.Content>
			</Tooltip>
			{autoStopLimitSeconds <= 0 && onSelectAutoStopSeconds && (
				<Tooltip>
					<LiquidDroplet glow="violet">
						<AutoStopTimerPopover
							autoStopSeconds={0}
							onSelectAutoStop={onSelectAutoStopSeconds}
							trigger={
								<Button
									isIconOnly
									variant="ghost"
									className={actionClass}
									aria-label={t("recording.autoStopTimer", "Auto-stop timer")}
								>
									<TimerIcon className="size-4 text-slate-700" />
								</Button>
							}
						/>
					</LiquidDroplet>
					<Tooltip.Content>
						{t("recording.autoStopTimer", "Set auto-stop timer")}
					</Tooltip.Content>
				</Tooltip>
			)}
			<Tooltip>
				<LiquidDroplet glow="red">
					<Button
						isIconOnly
						variant="danger"
						className={`${actionClass} ${styles.liquidRecordButton}`}
						onPress={onStopRecording}
						aria-label={t("recording.stop")}
					>
						<span className={styles.stopSquare} />
					</Button>
				</LiquidDroplet>
				<Tooltip.Content>{t("recording.stop")}</Tooltip.Content>
			</Tooltip>
			<Tooltip>
				<LiquidDroplet glow="glass">
					<Button
						isIconOnly
						variant="ghost"
						className={actionClass}
						onPress={onHideHud}
						aria-label={t("recording.hideHud")}
					>
						<MinusIcon className="size-4 text-slate-700" />
					</Button>
				</LiquidDroplet>
				<Tooltip.Content>{t("recording.hideHud")}</Tooltip.Content>
			</Tooltip>
			<Tooltip>
				<LiquidDroplet glow="red">
					<Button
						isIconOnly
						variant="ghost"
						className={`${actionClass} hover:text-red-600`}
						onPress={onCancelRecording}
						aria-label={t("recording.cancel")}
					>
						<XIcon className="size-4 text-slate-700 hover:text-red-600" />
					</Button>
				</LiquidDroplet>
				<Tooltip.Content>{t("recording.cancel")}</Tooltip.Content>
			</Tooltip>
		</div>
	);
}

