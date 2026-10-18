import { useCallback, useEffect, useState } from "react";
import { ArrowClockwise, Check, CheckCircleIcon, DownloadSimple } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

type UpdateStatus = "idle" | "checking" | "available" | "downloading" | "ready" | "error" | "up-to-date";

export function AppUpdateIndicator() {
	const [status, setStatus] = useState<UpdateStatus>("idle");
	const version = "v1.4.0";
	const [availableVersion, setAvailableVersion] = useState<string>();
	const [busy, setBusy] = useState(false);

	const refreshStatus = useCallback(async () => {
		try {
			if (!window.electronAPI?.getUpdateStatusSummary) return;
			const summary = await window.electronAPI.getUpdateStatusSummary();
			if (summary) {
				setStatus(summary.status as UpdateStatus);
				if (summary.availableVersion) setAvailableVersion(summary.availableVersion);
			}
		} catch {
			// Ignore in dev
		}
	}, []);

	useEffect(() => {
		void refreshStatus();
		const interval = setInterval(refreshStatus, 30000);
		return () => clearInterval(interval);
	}, [refreshStatus]);

	const handleCheckUpdates = async () => {
		setBusy(true);
		setStatus("checking");
		try {
			if (status === "ready") {
				await window.electronAPI?.installDownloadedUpdate?.();
				return;
			}
			if (status === "available" && availableVersion) {
				await window.electronAPI?.downloadAvailableUpdate?.(true);
				toast.info("Downloading update in background...");
				setStatus("downloading");
				return;
			}
			const result = await window.electronAPI?.checkForAppUpdates?.();
			if (result?.success) {
				toast.success("Checking for latest MotionCap releases...");
			} else {
				toast.info("MotionCap is running latest studio build.");
			}
			await refreshStatus();
		} catch (e: any) {
			toast.error(e?.message || "Failed to check for updates");
		} finally {
			setBusy(false);
		}
	};

	let badgeColor = "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
	let dotColor = "bg-emerald-400 shadow-[0_0_8px_#34d399]";
	let label = version;

	if (status === "checking" || busy) {
		badgeColor = "bg-indigo-500/15 text-indigo-300 border-indigo-500/30";
		dotColor = "bg-indigo-400 animate-pulse shadow-[0_0_8px_#818cf8]";
		label = "Checking...";
	} else if (status === "available") {
		badgeColor = "bg-sky-500/20 text-sky-200 border-sky-500/40";
		dotColor = "bg-sky-400 animate-ping";
		label = `Update ${availableVersion || ""}`;
	} else if (status === "downloading") {
		badgeColor = "bg-amber-500/20 text-amber-200 border-amber-500/40";
		dotColor = "bg-amber-400 animate-pulse";
		label = "Downloading...";
	} else if (status === "ready") {
		badgeColor = "bg-purple-500/20 text-purple-200 border-purple-500/40";
		dotColor = "bg-purple-400 shadow-[0_0_10px_#c084fc]";
		label = "Restart to apply";
	}

	return (
		<Button
			variant="ghost"
			size="sm"
			className={`h-8 gap-1.5 px-2.5 rounded-full text-xs font-medium border backdrop-blur-md transition-all ${badgeColor}`}
			onClick={handleCheckUpdates}
			title="MotionCap In-App Updates • Click to check for latest version"
		>
			<span className={`size-1.5 rounded-full ${dotColor}`} />
			{status === "checking" || busy ? (
				<ArrowClockwise className="size-3 animate-spin" />
			) : status === "available" ? (
				<DownloadSimple className="size-3" />
			) : status === "ready" ? (
				<CheckCircleIcon className="size-3" />
			) : (
				<Check className="size-3 opacity-60" />
			)}
			<span>{label}</span>
		</Button>
	);
}
