import { ToggleButton } from "@heroui/react";
import { Card } from "@heroui/react";
import { TextArea } from "@/components/ui/input";
import {
	AlignCenterHorizontal as AlignCenter,
	AlignLeft,
	AlignRight,
	TextB as Bold,
	ImageSquare as ImageIcon,
	Info,
	TextItalic as Italic,
	BoundingBox as SquareDashed,
	Trash as Trash2,
	TextT as Type,
	TextUnderline as Underline,
	UploadSimple as Upload,
} from "@/components/ui/icons";
import { ColorControl, ColorPalette } from "@/components/ui/color-picker";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { ChoiceGroup, ChoiceItem } from "@/components/ui/choice-group";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { type CustomFont, getCustomFonts } from "@/lib/customFonts";
import { cn } from "@/lib/utils";
import { useScopedT } from "../../contexts/I18nContext";
import { AddCustomFontDialog } from "./AddCustomFontDialog";
import { getArrowComponent } from "./ArrowSvgs";
import type {
	AnnotationRegion,
	AnnotationType,
	ArrowDirection,
	FigureData,
	HighlighterData,
	HighlighterStyle,
	ShapeData,
	ShapeKind,
	ShapeStrokeStyle,
	StepBadgeData,
	StepBadgeFormat,
	StepBadgeStyle,
} from "./types";
import {
	DEFAULT_HIGHLIGHTER_DATA,
	DEFAULT_SHAPE_DATA,
	DEFAULT_STEP_BADGE_DATA,
} from "./types";

interface AnnotationSettingsPanelProps {
	annotation: AnnotationRegion;
	onContentChange: (content: string) => void;
	onTypeChange: (type: AnnotationType) => void;
	onStyleChange: (style: Partial<AnnotationRegion["style"]>) => void;
	onFigureDataChange?: (figureData: FigureData) => void;
	onStepBadgeDataChange?: (stepBadgeData: StepBadgeData) => void;
	onHighlighterDataChange?: (highlighterData: HighlighterData) => void;
	onShapeDataChange?: (shapeData: ShapeData) => void;
	onBlurIntensityChange?: (intensity: number) => void;
	onBlurColorChange?: (color: string) => void;
	onDelete: () => void;
}

export const FONT_FAMILY_VALUES = [
	{ value: "system-ui, -apple-system, sans-serif", labelKey: "fontStyles.classic" },
	{ value: "Georgia, serif", labelKey: "fontStyles.editor" },
	{ value: "Impact, Arial Black, sans-serif", labelKey: "fontStyles.strong" },
	{ value: "Courier New, monospace", labelKey: "fontStyles.typewriter" },
	{ value: "Brush Script MT, cursive", labelKey: "fontStyles.deco" },
	{ value: "Arial, sans-serif", labelKey: "fontStyles.simple" },
	{ value: "Verdana, sans-serif", labelKey: "fontStyles.modern" },
	{ value: "Trebuchet MS, sans-serif", labelKey: "fontStyles.clean" },
];

export const FONT_SIZES = [12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72, 80, 96, 128];

export function AnnotationSettingsPanel({
	annotation,
	onContentChange,
	onTypeChange,
	onStyleChange,
	onFigureDataChange,
	onStepBadgeDataChange,
	onHighlighterDataChange,
	onShapeDataChange,
	onBlurIntensityChange,
	onBlurColorChange,
	onDelete,
}: AnnotationSettingsPanelProps) {
	const t = useScopedT("editor");
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [customFonts, setCustomFonts] = useState<CustomFont[]>([]);

	const fontFamilies = useMemo(
		() => FONT_FAMILY_VALUES.map((f) => ({ value: f.value, label: t(f.labelKey) })),
		[t],
	);

	// Load custom fonts on mount
	useEffect(() => {
		setCustomFonts(getCustomFonts());
	}, []);

	const colorPalette = [
		"#FF0000", // Red
		"#FFD700", // Yellow/Gold
		"#00FF00", // Green
		"#FFFFFF", // White
		"#0000FF", // Blue
		"#FF6B00", // Orange
		"#9B59B6", // Purple
		"#E91E63", // Pink
		"#00BCD4", // Cyan
		"#FF5722", // Deep Orange
		"#8BC34A", // Light Green
		"#FFC107", // Amber
		"#2563EB", // Brand Blue
		"#000000", // Black
		"#607D8B", // Blue Grey
		"#795548", // Brown
	];

	const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
		const files = event.target.files;
		if (!files || files.length === 0) return;

		const file = files[0];

		// Validate file type
		const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
		if (!validTypes.includes(file.type)) {
			toast.error(t("annotations.imageUploadError"), {
				description: t("annotations.imageUploadErrorDescription"),
			});
			event.target.value = "";
			return;
		}

		const reader = new FileReader();

		reader.onload = (e) => {
			const dataUrl = e.target?.result as string;
			if (dataUrl) {
				onContentChange(dataUrl);
				toast.success(t("annotations.imageUploadSuccess"));
			}
		};

		reader.onerror = () => {
			toast.error(t("annotations.imageUploadFailed"), {
				description: t("annotations.imageUploadFailedDescription"),
			});
		};

		reader.readAsDataURL(file);
		event.target.value = "";
	};

	return (
		<Card className="flex min-h-0 flex-1 flex-col gap-0 overflow-hidden rounded-none bg-transparent p-0 shadow-none">
			<div className="flex-1 min-h-0 px-5 pb-6 pt-1 overflow-y-auto custom-scrollbar">
				<div className="mb-6">
					{/* Type Selector */}
					<div className="space-y-4">
						<ChoiceGroup
							aria-label="Annotation type"
							value={annotation.type}
							onValueChange={(value) => onTypeChange(value as AnnotationType)}
							className="grid grid-cols-4 gap-2"
						>
							<ChoiceItem
								value="text"
								aria-label={t("annotations.text", "Text")}
								className="min-w-0 gap-1 px-1 text-xs"
							>
								<Type className="w-4 h-4" />
								{t("annotations.text", "Text")}
							</ChoiceItem>
							<ChoiceItem
								value="image"
								aria-label={t("annotations.image", "Image")}
								className="min-w-0 gap-1 px-1 text-xs"
							>
								<ImageIcon className="w-4 h-4" />
								{t("annotations.image", "Image")}
							</ChoiceItem>
							<ChoiceItem
								value="figure"
								aria-label={t("annotations.arrow", "Arrow")}
								className="min-w-0 gap-1 px-1 text-xs"
							>
								<svg
									className="w-4 h-4"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
								>
									<path
										d="M4 12h16m0 0l-6-6m6 6l-6 6"
										strokeLinecap="round"
										strokeLinejoin="round"
									/>
								</svg>
								{t("annotations.arrow", "Arrow")}
							</ChoiceItem>
							<ChoiceItem
								value="blur"
								aria-label={t("annotations.blur", "Blur")}
								className="min-w-0 gap-1 px-1 text-xs"
							>
								<SquareDashed className="w-4 h-4" />
								{t("annotations.blur", "Blur")}
							</ChoiceItem>
							<ChoiceItem
								value="step"
								aria-label={t("annotations.stepBadge", "Step")}
								className="min-w-0 gap-1 px-1 text-xs"
							>
								<span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">
									①
								</span>
								{t("annotations.stepBadge", "Step")}
							</ChoiceItem>
							<ChoiceItem
								value="highlight"
								aria-label={t("annotations.highlighter", "Highlight")}
								className="min-w-0 gap-1 px-1 text-xs"
							>
								<svg
									className="w-4 h-4"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
								>
									<path d="M12 20h9" strokeLinecap="round" strokeLinejoin="round" />
									<path
										d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"
										strokeLinecap="round"
										strokeLinejoin="round"
									/>
								</svg>
								{t("annotations.highlighter", "Highlight")}
							</ChoiceItem>
							<ChoiceItem
								value="shape"
								aria-label={t("annotations.shape", "Shape")}
								className="min-w-0 gap-1 px-1 text-xs"
							>
								<svg
									className="w-4 h-4"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
								>
									<rect
										x="3"
										y="3"
										width="18"
										height="18"
										rx="2"
										strokeLinecap="round"
										strokeLinejoin="round"
									/>
								</svg>
								{t("annotations.shape", "Shape")}
							</ChoiceItem>
						</ChoiceGroup>

						{/* Text Content */}
						{annotation.type === "text" && (
							<div className="space-y-4">
								<div>
									<label className="text-sm font-medium text-foreground mb-2 block">
										{t("annotations.textContent")}
									</label>
									<TextArea
										value={annotation.textContent || annotation.content}
										onChange={(e) => onContentChange(e.target.value)}
										placeholder={t("annotations.textPlaceholder")}
										rows={3}
										className="w-full px-3 py-2 text-sm resize-none"
									/>
								</div>

								{/* Styling Controls */}
								<div className="space-y-4">
									{/* Font Family & Size */}
									<div className="grid grid-cols-2 gap-2">
										<div>
											<label className="text-sm font-medium text-foreground mb-2 block">
												{t("annotations.fontStyle")}
											</label>
											<Select
												value={annotation.style.fontFamily}
												onValueChange={(value) =>
													onStyleChange({ fontFamily: value })
												}
											>
												<SelectTrigger className="w-full h-9 text-xs">
													<SelectValue
														placeholder={t("annotations.selectStyle")}
													/>
												</SelectTrigger>
												<SelectContent className="max-h-[300px]">
													{!fontFamilies.some(
														(font) =>
															font.value ===
															annotation.style.fontFamily,
													) &&
														!customFonts.some(
															(font) =>
																font.fontFamily ===
																annotation.style.fontFamily,
														) && (
															<SelectItem
																value={annotation.style.fontFamily}
															>
																{annotation.style.fontFamily
																	.split(",")[0]
																	.replace(/"/g, "")}
															</SelectItem>
														)}
													{fontFamilies.map((font) => (
														<SelectItem
															key={font.value}
															value={font.value}
															style={{ fontFamily: font.value }}
														>
															{font.label}
														</SelectItem>
													))}
													{customFonts.length > 0 && (
														<>
															<div className="px-2 py-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
																Custom Fonts
															</div>
															{customFonts.map((font) => (
																<SelectItem
																	key={font.id}
																	value={font.fontFamily}
																	style={{
																		fontFamily: font.fontFamily,
																	}}
																>
																	{font.name}
																</SelectItem>
															))}
														</>
													)}
												</SelectContent>
											</Select>
										</div>
										<div>
											<label className="text-sm font-medium text-foreground mb-2 block">
												{t("annotations.size")}
											</label>
											<Select
												value={annotation.style.fontSize.toString()}
												onValueChange={(value) =>
													onStyleChange({ fontSize: parseInt(value) })
												}
											>
												<SelectTrigger className="w-full h-9 text-xs">
													<SelectValue
														placeholder={t("annotations.size")}
													/>
												</SelectTrigger>
												<SelectContent className="max-h-[200px]">
													{FONT_SIZES.map((size) => (
														<SelectItem
															key={size}
															value={size.toString()}
														>
															{size}px
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
									</div>

									{/* Add Custom Font Button */}
									<div>
										<AddCustomFontDialog
											onFontAdded={(font) => {
												setCustomFonts(getCustomFonts());
												onStyleChange({ fontFamily: font.fontFamily });
											}}
										/>
									</div>

									{/* Formatting Toggles */}
									<div className="flex flex-wrap items-center justify-between gap-2">
										<ToggleGroup
											type="multiple"
											value={[
												...(annotation.style.fontWeight === "bold"
													? ["bold"]
													: []),
												...(annotation.style.fontStyle === "italic"
													? ["italic"]
													: []),
												...(annotation.style.textDecoration === "underline"
													? ["underline"]
													: []),
											]}
											size="sm"
											className="justify-start"
										>
											<ToggleGroupItem
												value="bold"
												aria-label={t("annotations.toggleBold")}
												onClick={() =>
													onStyleChange({
														fontWeight:
															annotation.style.fontWeight === "bold"
																? "normal"
																: "bold",
													})
												}
												className="h-8 w-8 min-w-8 p-0"
											>
												<Bold className="h-4 w-4" />
											</ToggleGroupItem>
											<ToggleGroupItem
												value="italic"
												aria-label={t("annotations.toggleItalic")}
												onClick={() =>
													onStyleChange({
														fontStyle:
															annotation.style.fontStyle === "italic"
																? "normal"
																: "italic",
													})
												}
												className="h-8 w-8 min-w-8 p-0"
											>
												<Italic className="h-4 w-4" />
											</ToggleGroupItem>
											<ToggleGroupItem
												value="underline"
												aria-label={t("annotations.toggleUnderline")}
												onClick={() =>
													onStyleChange({
														textDecoration:
															annotation.style.textDecoration ===
															"underline"
																? "none"
																: "underline",
													})
												}
												className="h-8 w-8 min-w-8 p-0"
											>
												<Underline className="h-4 w-4" />
											</ToggleGroupItem>
										</ToggleGroup>

										<ToggleGroup
											type="single"
											value={annotation.style.textAlign}
											size="sm"
											className="justify-start"
										>
											<ToggleGroupItem
												value="left"
												aria-label={t("annotations.alignLeft")}
												onClick={() => onStyleChange({ textAlign: "left" })}
												className="h-8 w-8 min-w-8 p-0"
											>
												<AlignLeft className="h-4 w-4" />
											</ToggleGroupItem>
											<ToggleGroupItem
												value="center"
												aria-label={t("annotations.alignCenter")}
												onClick={() =>
													onStyleChange({ textAlign: "center" })
												}
												className="h-8 w-8 min-w-8 p-0"
											>
												<AlignCenter className="h-4 w-4" />
											</ToggleGroupItem>
											<ToggleGroupItem
												value="right"
												aria-label={t("annotations.alignRight")}
												onClick={() =>
													onStyleChange({ textAlign: "right" })
												}
												className="h-8 w-8 min-w-8 p-0"
											>
												<AlignRight className="h-4 w-4" />
											</ToggleGroupItem>
										</ToggleGroup>
									</div>

									{/* Colors */}
									<div className="grid grid-cols-2 gap-4">
										<div>
											<label className="text-sm font-medium text-foreground mb-2 block">
												{t("annotations.textColor")}
											</label>
											<ColorControl
												value={annotation.style.color}
												label={t("annotations.textColor")}
												onChange={(color) => onStyleChange({ color })}
												colors={colorPalette}
												compact
											/>
										</div>
										<div>
											<label className="text-sm font-medium text-foreground mb-2 block">
												{t("annotations.background")}
											</label>
											<ColorControl
												value={annotation.style.backgroundColor}
												label={t("annotations.background")}
												onChange={(color) =>
													onStyleChange({ backgroundColor: color })
												}
												colors={colorPalette}
												compact
												onClear={() =>
													onStyleChange({
														backgroundColor: "transparent",
													})
												}
											/>
										</div>
									</div>
								</div>
							</div>
						)}

						{/* Image Upload */}
						{annotation.type === "image" && (
							<div className="space-y-4">
								<input
									type="file"
									ref={fileInputRef}
									onChange={handleImageUpload}
									accept=".jpg,.jpeg,.png,.gif,.webp,image/*"
									className="hidden"
								/>
								<Button
									onClick={() => fileInputRef.current?.click()}
									variant="outline"
									className="w-full gap-2 py-8"
								>
									<Upload className="w-5 h-5" />
									{t("annotations.uploadImage")}
								</Button>

								{annotation.content &&
									annotation.content.startsWith("data:image") && (
										<div className="rounded-lg border border-foreground/10 overflow-hidden bg-foreground/5 p-2">
											<img
												src={annotation.content}
												alt="Uploaded annotation"
												className="w-full h-auto rounded-md"
											/>
										</div>
									)}

								<p className="text-xs text-muted-foreground/70 text-center leading-relaxed">
									{t("annotations.supportedFormats")}
								</p>
							</div>
						)}

						{annotation.type === "figure" && (
							<div className="space-y-4">
								<div>
									<label className="text-sm font-medium text-foreground mb-3 block">
										{t("annotations.arrowDirection")}
									</label>
									<div className="grid grid-cols-4 gap-2">
										{(
											[
												"up",
												"down",
												"left",
												"right",
												"up-right",
												"up-left",
												"down-right",
												"down-left",
											] as ArrowDirection[]
										).map((direction) => {
											const ArrowComponent = getArrowComponent(direction);
											return (
												<ToggleButton
													isSelected={
														annotation.figureData?.arrowDirection ===
														direction
													}
													key={direction}
													onClick={() => {
														const newFigureData: FigureData = {
															...annotation.figureData!,
															arrowDirection: direction,
														};
														onFigureDataChange?.(newFigureData);
													}}
													aria-label={t(
														"annotations.arrowDirectionOption",
														"Arrow direction: {{direction}}",
														{ direction: direction.replace(/-/g, " ") },
													)}
													className={cn(
														"h-16 flex items-center justify-center p-2",
													)}
												>
													<ArrowComponent
														color={
															annotation.figureData
																?.arrowDirection === direction
																? "#ffffff"
																: "#94a3b8"
														}
														strokeWidth={3}
													/>
												</ToggleButton>
											);
										})}
									</div>
								</div>

								<div>
									<label className="text-sm font-medium text-foreground mb-2 block">
										{t("annotations.strokeWidth", undefined, {
											width: annotation.figureData?.strokeWidth || 4,
										})}
									</label>
									<Slider
										aria-label={t("annotations.strokeWidth", undefined, {
											width: annotation.figureData?.strokeWidth || 4,
										})}
										value={[annotation.figureData?.strokeWidth || 4]}
										onValueChange={([value]) => {
											const newFigureData: FigureData = {
												...annotation.figureData!,
												strokeWidth: value,
											};
											onFigureDataChange?.(newFigureData);
										}}
										min={1}
										max={6}
										step={1}
										className="my-3 w-full"
									/>
								</div>

								<div>
									<label className="text-sm font-medium text-foreground mb-2 block">
										{t("annotations.arrowColor")}
									</label>
									<ColorControl
										value={annotation.figureData?.color || "#2563EB"}
										label={t("annotations.arrowColor")}
										onChange={(color) =>
											onFigureDataChange?.({
												...annotation.figureData!,
												color,
											})
										}
										colors={colorPalette}
										compact
									/>
								</div>
							</div>
						)}

						{annotation.type === "blur" && (
							<div className="space-y-4">
								<div className="flex flex-col items-center">
									<div className="w-full space-y-5">
										<div className="flex items-center justify-between">
											<span className="text-sm font-medium text-foreground">
												{t("annotations.blurStrength", undefined, {
													strength: annotation.blurIntensity ?? 20,
												})}
											</span>
										</div>
										<Slider
											aria-label={t("annotations.blurStrength", undefined, {
												strength: annotation.blurIntensity ?? 20,
											})}
											value={[annotation.blurIntensity ?? 20]}
											onValueChange={([value]) =>
												onBlurIntensityChange?.(value)
											}
											min={1}
											max={100}
											step={1}
											className="w-full"
										/>
									</div>

									<div className="w-full space-y-5 mt-4">
										<div className="flex items-center justify-between">
											<span className="text-sm font-medium text-foreground">
												{t(
													"annotations.solidColor",
													"Solid Color (Censorship)",
												)}
											</span>
										</div>
										<div className="flex flex-col gap-3">
											<Button
												variant="secondary"
												aria-pressed={
													!annotation.blurColor ||
													annotation.blurColor === "transparent"
												}
												onClick={() => onBlurColorChange?.("")}
											>
												{t("annotations.none", "None")}
											</Button>
											<ColorPalette
												color={annotation.blurColor || "transparent"}
												colors={colorPalette}
												onChange={({ hex }) => onBlurColorChange?.(hex)}
											/>
											<ColorControl
												label={t("annotations.customColor", "Custom color")}
												value={annotation.blurColor || "#000000"}
												onChange={(color) => onBlurColorChange?.(color)}
											/>
										</div>
									</div>
								</div>
							</div>
						)}

						{annotation.type === "step" && (
							<div className="space-y-4">
								<div>
									<label className="text-sm font-medium text-foreground mb-2 block">
										{t("annotations.stepNumber", "Step Number")}
									</label>
									<div className="flex items-center gap-3">
										<Button
											variant="outline"
											size="sm"
											className="h-9 w-9 p-0 text-base font-bold"
											onClick={() => {
												const current = annotation.stepBadgeData?.stepNumber ?? 1;
												const next = Math.max(1, current - 1);
												onStepBadgeDataChange?.({
													...(annotation.stepBadgeData || DEFAULT_STEP_BADGE_DATA),
													stepNumber: next,
												});
											}}
										>
											-
										</Button>
										<span className="flex-1 text-center text-lg font-bold text-foreground">
											{annotation.stepBadgeData?.stepNumber ?? 1}
										</span>
										<Button
											variant="outline"
											size="sm"
											className="h-9 w-9 p-0 text-base font-bold"
											onClick={() => {
												const current = annotation.stepBadgeData?.stepNumber ?? 1;
												onStepBadgeDataChange?.({
													...(annotation.stepBadgeData || DEFAULT_STEP_BADGE_DATA),
													stepNumber: current + 1,
												});
											}}
										>
											+
										</Button>
									</div>
								</div>

								<div>
									<label className="text-sm font-medium text-foreground mb-2 block">
										{t("annotations.badgeFormat", "Display Format")}
									</label>
									<ChoiceGroup
										aria-label="Step format"
										value={annotation.stepBadgeData?.badgeFormat || "circled"}
										onValueChange={(val) =>
											onStepBadgeDataChange?.({
												...(annotation.stepBadgeData || DEFAULT_STEP_BADGE_DATA),
												badgeFormat: val as StepBadgeFormat,
											})
										}
										className="grid grid-cols-3 gap-2"
									>
										<ChoiceItem value="circled" className="text-xs">
											① {t("annotations.formatCircled", "Circled")}
										</ChoiceItem>
										<ChoiceItem value="number" className="text-xs">
											1 {t("annotations.formatNumber", "Number")}
										</ChoiceItem>
										<ChoiceItem value="step-prefix" className="text-xs">
											Step 1
										</ChoiceItem>
									</ChoiceGroup>
								</div>

								<div>
									<label className="text-sm font-medium text-foreground mb-2 block">
										{t("annotations.badgeStyle", "Badge Style")}
									</label>
									<ChoiceGroup
										aria-label="Badge style"
										value={annotation.stepBadgeData?.badgeStyle || "filled"}
										onValueChange={(val) =>
											onStepBadgeDataChange?.({
												...(annotation.stepBadgeData || DEFAULT_STEP_BADGE_DATA),
												badgeStyle: val as StepBadgeStyle,
											})
										}
										className="grid grid-cols-3 gap-2"
									>
										<ChoiceItem value="filled" className="text-xs">
											{t("annotations.styleFilled", "Filled")}
										</ChoiceItem>
										<ChoiceItem value="outline" className="text-xs">
											{t("annotations.styleOutline", "Outline")}
										</ChoiceItem>
										<ChoiceItem value="pill" className="text-xs">
											{t("annotations.stylePill", "Pill")}
										</ChoiceItem>
									</ChoiceGroup>
								</div>

								{(annotation.stepBadgeData?.badgeStyle === "pill" ||
									annotation.stepBadgeData?.badgeFormat === "step-prefix") && (
									<div>
										<label className="text-sm font-medium text-foreground mb-2 block">
											{t("annotations.badgeLabel", "Badge Label")}
										</label>
										<input
											type="text"
											value={annotation.stepBadgeData?.label ?? ""}
											onChange={(e) =>
												onStepBadgeDataChange?.({
													...(annotation.stepBadgeData || DEFAULT_STEP_BADGE_DATA),
													label: e.target.value,
												})
											}
											placeholder={t("annotations.badgeLabelPlaceholder", "e.g. Click Here")}
											className="w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
										/>
									</div>
								)}

								<div>
									<label className="text-sm font-medium text-foreground mb-2 block">
										{t("annotations.badgeColor", "Badge Color")}
									</label>
									<ColorControl
										value={annotation.stepBadgeData?.color || "#2563EB"}
										label={t("annotations.badgeColor", "Badge Color")}
										onChange={(color) =>
											onStepBadgeDataChange?.({
												...(annotation.stepBadgeData || DEFAULT_STEP_BADGE_DATA),
												color,
											})
										}
										colors={colorPalette}
										compact
									/>
								</div>
							</div>
						)}

						{annotation.type === "highlight" && (
							<div className="space-y-4">
								<div>
									<label className="text-sm font-medium text-foreground mb-2 block">
										{t("annotations.highlightColor", "Highlighter Color")}
									</label>
									<ColorControl
										value={annotation.highlighterData?.color || "#FDE047"}
										label={t("annotations.highlightColor", "Highlighter Color")}
										onChange={(color) =>
											onHighlighterDataChange?.({
												...(annotation.highlighterData || DEFAULT_HIGHLIGHTER_DATA),
												color,
											})
										}
										colors={[
											"#FDE047",
											"#86EFAC",
											"#67E8F9",
											"#F472B6",
											"#FB923C",
											"#C084FC",
											"#F87171",
											"#FFFFFF",
										]}
										compact
									/>
								</div>

								<div className="space-y-2">
									<div className="flex items-center justify-between">
										<label className="text-sm font-medium text-foreground">
											{t("annotations.highlightOpacity", "Opacity")}
										</label>
										<span className="text-xs text-muted-foreground">
											{Math.round((annotation.highlighterData?.opacity ?? 0.45) * 100)}%
										</span>
									</div>
									<Slider
										aria-label={t("annotations.highlightOpacity", "Opacity")}
										value={[(annotation.highlighterData?.opacity ?? 0.45) * 100]}
										onValueChange={([val]) =>
											onHighlighterDataChange?.({
												...(annotation.highlighterData || DEFAULT_HIGHLIGHTER_DATA),
												opacity: val / 100,
											})
										}
										min={10}
										max={90}
										step={5}
										className="w-full"
									/>
								</div>

								<div>
									<label className="text-sm font-medium text-foreground mb-2 block">
										{t("annotations.highlightStyle", "Highlight Style")}
									</label>
									<ChoiceGroup
										aria-label="Highlight style"
										value={annotation.highlighterData?.highlightStyle || "box"}
										onValueChange={(val) =>
											onHighlighterDataChange?.({
												...(annotation.highlighterData || DEFAULT_HIGHLIGHTER_DATA),
												highlightStyle: val as HighlighterStyle,
											})
										}
										className="grid grid-cols-3 gap-2"
									>
										<ChoiceItem value="box" className="text-xs">
											{t("annotations.highlightBox", "Box")}
										</ChoiceItem>
										<ChoiceItem value="underline" className="text-xs">
											{t("annotations.highlightUnderline", "Underline")}
										</ChoiceItem>
										<ChoiceItem value="marker" className="text-xs">
											{t("annotations.highlightMarker", "Marker")}
										</ChoiceItem>
									</ChoiceGroup>
								</div>

								{(annotation.highlighterData?.highlightStyle || "box") === "box" && (
									<div className="space-y-2">
										<div className="flex items-center justify-between">
											<label className="text-sm font-medium text-foreground">
												{t("annotations.cornerRadius", "Corner Radius")}
											</label>
											<span className="text-xs text-muted-foreground">
												{annotation.highlighterData?.borderRadius ?? 4}px
											</span>
										</div>
										<Slider
											aria-label={t("annotations.cornerRadius", "Corner Radius")}
											value={[annotation.highlighterData?.borderRadius ?? 4]}
											onValueChange={([val]) =>
												onHighlighterDataChange?.({
													...(annotation.highlighterData || DEFAULT_HIGHLIGHTER_DATA),
													borderRadius: val,
												})
											}
											min={0}
											max={24}
											step={1}
											className="w-full"
										/>
									</div>
								)}
							</div>
						)}

						{annotation.type === "shape" && (
							<div className="space-y-4">
								<div>
									<label className="text-sm font-medium text-foreground mb-2 block">
										{t("annotations.shapeKind", "Shape")}
									</label>
									<ChoiceGroup
										aria-label="Shape kind"
										value={annotation.shapeData?.shapeKind || "rectangle"}
										onValueChange={(val) =>
											onShapeDataChange?.({
												...(annotation.shapeData || DEFAULT_SHAPE_DATA),
												shapeKind: val as ShapeKind,
											})
										}
										className="grid grid-cols-2 gap-2"
									>
										<ChoiceItem value="rectangle" className="text-xs">
											{t("annotations.shapeRectangle", "Rectangle")}
										</ChoiceItem>
										<ChoiceItem value="circle" className="text-xs">
											{t("annotations.shapeCircle", "Circle")}
										</ChoiceItem>
									</ChoiceGroup>
								</div>

								<div>
									<label className="text-sm font-medium text-foreground mb-2 block">
										{t("annotations.strokeStyle", "Stroke Style")}
									</label>
									<ChoiceGroup
										aria-label="Stroke style"
										value={annotation.shapeData?.strokeStyle || "solid"}
										onValueChange={(val) =>
											onShapeDataChange?.({
												...(annotation.shapeData || DEFAULT_SHAPE_DATA),
												strokeStyle: val as ShapeStrokeStyle,
											})
										}
										className="grid grid-cols-3 gap-2"
									>
										<ChoiceItem value="solid" className="text-xs">
											{t("annotations.strokeSolid", "Solid")}
										</ChoiceItem>
										<ChoiceItem value="dashed" className="text-xs">
											{t("annotations.strokeDashed", "Dashed")}
										</ChoiceItem>
										<ChoiceItem value="dotted" className="text-xs">
											{t("annotations.strokeDotted", "Dotted")}
										</ChoiceItem>
									</ChoiceGroup>
								</div>

								<div className="space-y-2">
									<div className="flex items-center justify-between">
										<label className="text-sm font-medium text-foreground">
											{t("annotations.strokeWidth", "Stroke Width")}
										</label>
										<span className="text-xs text-muted-foreground">
											{annotation.shapeData?.strokeWidth ?? 4}px
										</span>
									</div>
									<Slider
										aria-label={t("annotations.strokeWidth", "Stroke Width")}
										value={[annotation.shapeData?.strokeWidth ?? 4]}
										onValueChange={([val]) =>
											onShapeDataChange?.({
												...(annotation.shapeData || DEFAULT_SHAPE_DATA),
												strokeWidth: val,
											})
										}
										min={1}
										max={24}
										step={1}
										className="w-full"
									/>
								</div>

								<div>
									<label className="text-sm font-medium text-foreground mb-2 block">
										{t("annotations.strokeColor", "Outline Color")}
									</label>
									<ColorControl
										value={annotation.shapeData?.strokeColor || "#EF4444"}
										label={t("annotations.strokeColor", "Outline Color")}
										onChange={(color) =>
											onShapeDataChange?.({
												...(annotation.shapeData || DEFAULT_SHAPE_DATA),
												strokeColor: color,
											})
										}
										colors={colorPalette}
										compact
									/>
								</div>

								{(annotation.shapeData?.shapeKind || "rectangle") === "rectangle" && (
									<div className="space-y-2">
										<div className="flex items-center justify-between">
											<label className="text-sm font-medium text-foreground">
												{t("annotations.cornerRadius", "Corner Radius")}
											</label>
											<span className="text-xs text-muted-foreground">
												{annotation.shapeData?.cornerRadius ?? 8}px
											</span>
										</div>
										<Slider
											aria-label={t("annotations.cornerRadius", "Corner Radius")}
											value={[annotation.shapeData?.cornerRadius ?? 8]}
											onValueChange={([val]) =>
												onShapeDataChange?.({
													...(annotation.shapeData || DEFAULT_SHAPE_DATA),
													cornerRadius: val,
												})
											}
											min={0}
											max={32}
											step={1}
											className="w-full"
										/>
									</div>
								)}

								<div>
									<label className="text-sm font-medium text-foreground mb-2 block">
										{t("annotations.fillColor", "Fill Color")}
									</label>
									<div className="flex flex-col gap-2">
										<Button
											variant="secondary"
											size="sm"
											className="w-full text-xs"
											onClick={() =>
												onShapeDataChange?.({
													...(annotation.shapeData || DEFAULT_SHAPE_DATA),
													fillColor: "transparent",
												})
											}
										>
											{t("annotations.none", "Transparent (No Fill)")}
										</Button>
										<ColorPalette
											color={annotation.shapeData?.fillColor || "transparent"}
											colors={colorPalette}
											onChange={({ hex }) =>
												onShapeDataChange?.({
													...(annotation.shapeData || DEFAULT_SHAPE_DATA),
													fillColor: hex,
												})
											}
										/>
									</div>
								</div>
							</div>
						)}
					</div>

					<details className="mt-4 text-muted-foreground">
						<summary className="flex cursor-pointer items-center gap-2 py-2">
							<Info className="w-3.5 h-3.5" />
							<span className="text-xs font-medium">
								{t("annotations.shortcutsAndTips")}
							</span>
						</summary>
						<ul className="text-xs text-muted-foreground space-y-1.5 list-disc pl-3 leading-relaxed">
							<li>{t("annotations.tipSelectAnnotation")}</li>
							<li>{t("annotations.tipCycleForward")}</li>
							<li>{t("annotations.tipCycleBackward")}</li>
						</ul>
					</details>
				</div>
			</div>
			<div className="shrink-0 px-5 py-4">
				<Button
					onClick={onDelete}
					variant="destructive-soft"
					size="sm"
					className="w-full gap-2"
				>
					<Trash2 className="w-4 h-4" />
					{t("annotations.deleteAnnotation")}
				</Button>
			</div>
		</Card>
	);
}
