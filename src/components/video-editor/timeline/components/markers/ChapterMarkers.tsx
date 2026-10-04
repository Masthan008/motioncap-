import React, { useEffect, useRef, useState } from "react";
import { useTimelineContext } from "dnd-timeline";
import { useTimelinePresentation } from "../../core/TimelinePresentation";
import { getPlayheadDisplayTime, getTimeAtClipSeam } from "../../core/clipPresentation";
import type { ChapterMarker } from "../../../types";
import { formatChapterTimestamp } from "../../chapterMarkers";

interface ChapterMarkersProps {
	chapters: ChapterMarker[];
	selectedChapterId: string | null;
	onSelectChapter: (id: string | null) => void;
	onChapterMove: (id: string, newTimeMs: number) => void;
	onChapterRename: (id: string, newTitle: string) => void;
	onChapterDelete?: (id: string) => void;
	videoDurationMs: number;
	timelineRef: React.RefObject<HTMLDivElement | null>;
}

export const ChapterMarkers: React.FC<ChapterMarkersProps> = ({
	chapters,
	selectedChapterId,
	onSelectChapter,
	onChapterMove,
	onChapterRename,
	onChapterDelete,
	videoDurationMs,
	timelineRef,
}) => {
	const { sidebarWidth, range, valueToPixels, pixelsToValue } = useTimelineContext();
	const { clips } = useTimelinePresentation();
	const [draggingChapterId, setDraggingChapterId] = useState<string | null>(null);
	const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
	const [editingTitle, setEditingTitle] = useState("");
	const editInputRef = useRef<HTMLInputElement | null>(null);

	useEffect(() => {
		if (editingChapterId && editInputRef.current) {
			editInputRef.current.focus();
			editInputRef.current.select();
		}
	}, [editingChapterId]);

	useEffect(() => {
		if (!draggingChapterId) return;

		const handleMouseMove = (e: MouseEvent) => {
			if (!timelineRef.current) return;

			const rect = timelineRef.current.getBoundingClientRect();
			const clickX = e.clientX - rect.left - sidebarWidth;
			const relativeMs = pixelsToValue(clickX);
			const absoluteMs = Math.max(0, Math.min(range.start + relativeMs, videoDurationMs));

			onChapterMove(draggingChapterId, getTimeAtClipSeam(absoluteMs, clips));
		};

		const handleMouseUp = () => {
			setDraggingChapterId(null);
			document.body.style.cursor = "";
		};

		window.addEventListener("mousemove", handleMouseMove);
		window.addEventListener("mouseup", handleMouseUp);
		document.body.style.cursor = "ew-resize";

		return () => {
			window.removeEventListener("mousemove", handleMouseMove);
			window.removeEventListener("mouseup", handleMouseUp);
			document.body.style.cursor = "";
		};
	}, [
		clips,
		draggingChapterId,
		onChapterMove,
		timelineRef,
		sidebarWidth,
		range.start,
		videoDurationMs,
		pixelsToValue,
	]);

	const handleCommitTitle = (id: string) => {
		const trimmed = editingTitle.trim();
		if (trimmed) {
			onChapterRename(id, trimmed);
		}
		setEditingChapterId(null);
	};

	return (
		<>
			{chapters.map((chapter) => {
				const displayTimeMs = getPlayheadDisplayTime(chapter.timeMs, clips);
				const offset = valueToPixels(displayTimeMs - range.start);
				const isSelected = chapter.id === selectedChapterId;
				const isDragging = chapter.id === draggingChapterId;
				const isEditing = chapter.id === editingChapterId;
				const timestampLabel = formatChapterTimestamp(chapter.timeMs);

				return (
					<div
						key={chapter.id}
						className="absolute top-0 pointer-events-auto select-none"
						style={{
							left: `${sidebarWidth + offset}px`,
							zIndex: isDragging ? 60 : isSelected ? 50 : 35,
							transition: isDragging ? "none" : "left 0.08s ease-out",
						}}
						onClick={(e) => {
							e.stopPropagation();
							onSelectChapter(chapter.id);
						}}
						onDoubleClick={(e) => {
							e.stopPropagation();
							setEditingChapterId(chapter.id);
							setEditingTitle(chapter.title);
						}}
					>
						{/* Vertical hairline guideline down timeline */}
						<div
							className={`absolute top-5 left-0 w-[1px] h-[320px] pointer-events-none transition-opacity ${
								isSelected
									? "bg-amber-400 opacity-90 shadow-[0_0_6px_rgba(251,191,36,0.6)]"
									: "bg-amber-400/40 opacity-50"
							}`}
						/>

						{/* Interactive chapter pin badge */}
						<div
							className={`relative -left-1/2 flex items-center gap-1 px-1.5 py-0.5 rounded cursor-grab active:cursor-grabbing text-[11px] font-medium transition-all shadow-md ${
								isSelected
									? "bg-amber-500 text-black ring-2 ring-amber-300 ring-offset-1 ring-offset-background scale-105"
									: "bg-amber-500/80 hover:bg-amber-500 text-black hover:scale-102"
							}`}
							onMouseDown={(e) => {
								if (isEditing) return;
								e.stopPropagation();
								onSelectChapter(chapter.id);
								if (e.button === 0) {
									setDraggingChapterId(chapter.id);
								}
							}}
							onContextMenu={(e) => {
								e.preventDefault();
								e.stopPropagation();
								onChapterDelete?.(chapter.id);
							}}
							title={`${chapter.title} (${timestampLabel}) - Drag to reposition, double-click to rename, Del to remove`}
						>
							<svg
								className="w-2.5 h-2.5 shrink-0"
								viewBox="0 0 24 24"
								fill="currentColor"
								aria-hidden="true"
							>
								<path d="M5 3v18l7-5 7 5V3z" />
							</svg>

							{isEditing ? (
								<input
									ref={editInputRef}
									type="text"
									value={editingTitle}
									className="bg-black/80 text-white px-1 py-0 rounded text-[10px] w-24 outline-none border border-amber-400"
									onChange={(e) => setEditingTitle(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === "Enter") {
											handleCommitTitle(chapter.id);
										} else if (e.key === "Escape") {
											setEditingChapterId(null);
										}
										e.stopPropagation();
									}}
									onBlur={() => handleCommitTitle(chapter.id)}
									onClick={(e) => e.stopPropagation()}
								/>
							) : (
								<>
									<span className="truncate max-w-[120px] tracking-tight">
										{chapter.title}
									</span>
									{isSelected && (
										<button
											type="button"
											aria-label="Delete chapter marker"
											className="hover:bg-black/30 rounded p-0.5 ml-0.5 transition-colors"
											onClick={(e) => {
												e.stopPropagation();
												onChapterDelete?.(chapter.id);
											}}
										>
											<svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
												<path d="M18 6L6 18M6 6l12 12" />
											</svg>
										</button>
									)}
								</>
							)}
						</div>
					</div>
				);
			})}
		</>
	);
};

export default ChapterMarkers;
