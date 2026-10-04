import { TimerIcon } from "@/components/ui/icons";
import type { ReactElement } from "react";
import { useScopedT } from "@/contexts/I18nContext";
import styles from "../LaunchWindow.module.css";
import { DropdownItem, HudPopover } from "./PopoverScaffold";
import { useLaunchPopoverCoordinator } from "./LaunchPopoverCoordinator";
import {
	AUTO_STOP_PRESETS,
	type AutoStopPreset,
} from "../autoStopTimer";

const POPOVER_ID = "autoStop";

export function AutoStopTimerPopover({
	trigger,
	autoStopSeconds,
	onSelectAutoStop,
}: {
	trigger: ReactElement;
	autoStopSeconds: number;
	onSelectAutoStop: (seconds: number) => void;
}) {
	const t = useScopedT("launch");
	const { isOpen, requestOpen, requestClose } = useLaunchPopoverCoordinator();
	const open = isOpen(POPOVER_ID);

	return (
		<HudPopover
			open={open}
			onOpenChange={(nextOpen) => {
				if (!nextOpen) {
					requestClose(POPOVER_ID);
					return;
				}
				requestOpen(POPOVER_ID);
			}}
			trigger={trigger}
			align="center"
		>
			<div className={styles.ddLabel}>
				{t("recording.autoStopTimer", "Auto-stop timer")}
			</div>
			{AUTO_STOP_PRESETS.map((preset: AutoStopPreset) => (
				<DropdownItem
					key={preset.seconds}
					icon={<TimerIcon size={16} />}
					selected={autoStopSeconds === preset.seconds}
					onClick={() => {
						onSelectAutoStop(preset.seconds);
						requestClose(POPOVER_ID);
					}}
				>
					{preset.seconds === 0
						? t("recording.autoStopOff", "Off (manual stop)")
						: preset.label}
				</DropdownItem>
			))}
		</HudPopover>
	);
}
