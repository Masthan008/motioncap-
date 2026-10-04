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
			<Button
				isIconOnly
				variant="ghost"
				className={actionClass}
				aria-label={t("recording.home")}
				onPress={onHome}
			>
				<House weight="fill" className="size-4" />
			</Button>
			<div
				className="flex items-center gap-2.5 px-2"
				role="status"
				aria-label={paused ? t("recording.paused") : t("recording.rec")}
			>
				<span
					className={`size-2 rounded-full ${paused ? "bg-warning" : `bg-danger ${styles.recDotBlink}`}`}
				/>
				<span className="min-w-14 text-sm font-medium tabular-nums text-foreground">
					{formatTime(elapsed)}
				</span>
				{paused && (
					<span className="text-xs text-muted-foreground">{t("recording.paused")}</span>
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
										? "bg-red-500/20 border-red-500/50 text-red-300 animate-pulse"
										: remaining <= 60
											? "bg-amber-500/15 border-amber-500/40 text-amber-300"
											: "bg-white/10 border-white/20 text-white/90 hover:bg-white/15"
								}`}
								title={
									t("recording.autoStopRemaining", undefined, {
										time: formatRemainingCountdown(remaining),
									}) ?? `Auto-stop in ${formatRemainingCountdown(remaining)}`
								}
							>
								<TimerIcon
									size={12}
									className={remaining <= 60 ? "text-amber-400" : "text-white/70"}
								/>
								<span>{formatRemainingCountdown(remaining)}</span>
							</button>
						}
					/>
				)}
			</div>
			<Tooltip>
				<Button
					isIconOnly
					variant="ghost"
					isDisabled
					className={actionClass}
					aria-label={microphoneEnabled ? "Microphone on" : "Microphone off"}
				>
					{microphoneEnabled ? (
						<MicrophoneIcon weight="fill" className="size-4" />
					) : (
						<MicrophoneSlashIcon className="size-4" />
					)}
				</Button>
				<Tooltip.Content>{t("recording.micToggleDisabledTip")}</Tooltip.Content>
			</Tooltip>
			<Separator orientation="vertical" className="mx-1 h-5 self-center" />
			<Tooltip>
				<Button
					isIconOnly
					variant="ghost"
					className={actionClass}
					onPress={onPauseResume}
					aria-label={paused ? t("recording.resume") : t("recording.pause")}
				>
					{paused ? (
						<PlayIcon weight="fill" className="size-4" />
					) : (
						<PauseIcon weight="fill" className="size-4" />
					)}
				</Button>
				<Tooltip.Content>
					{paused ? t("recording.resume") : t("recording.pause")}
				</Tooltip.Content>
			</Tooltip>
			{autoStopLimitSeconds <= 0 && onSelectAutoStopSeconds && (
				<Tooltip>
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
								<TimerIcon className="size-4" />
							</Button>
						}
					/>
					<Tooltip.Content>
						{t("recording.autoStopTimer", "Set auto-stop timer")}
					</Tooltip.Content>
				</Tooltip>
			)}
			<Tooltip>
				<Button
					isIconOnly
					variant="danger"
					className={actionClass}
					onPress={onStopRecording}
					aria-label={t("recording.stop")}
				>
					<span className="size-3 rounded-[3px] bg-current" />
				</Button>
				<Tooltip.Content>{t("recording.stop")}</Tooltip.Content>
			</Tooltip>
			<Tooltip>
				<Button
					isIconOnly
					variant="ghost"
					className={actionClass}
					onPress={onHideHud}
					aria-label={t("recording.hideHud")}
				>
					<MinusIcon className="size-4" />
				</Button>
				<Tooltip.Content>{t("recording.hideHud")}</Tooltip.Content>
			</Tooltip>
			<Tooltip>
				<Button
					isIconOnly
					variant="ghost"
					className={actionClass}
					onPress={onCancelRecording}
					aria-label={t("recording.cancel")}
				>
					<XIcon className="size-4" />
				</Button>
				<Tooltip.Content>{t("recording.cancel")}</Tooltip.Content>
			</Tooltip>
		</div>
	);
}
