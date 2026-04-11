import type { ResumeFontPreset, ResumeTemplate } from "@/lib/types";
import { RESUME_FONT_PRESETS, resolveFontPreset } from "@/lib/resume-fonts";
import { cn } from "@/lib/utils";

function fonts(preset: ResumeFontPreset) {
  return RESUME_FONT_PRESETS[resolveFontPreset(preset)];
}

/** Which font class to use for a heading level given template + preset. */
export function resumeHeadingFontClass(
  template: ResumeTemplate,
  level: number,
  preset: ResumeFontPreset
): string {
  const { bodyClass, displayClass } = fonts(preset);
  if (template === "modern" && level === 2) {
    return "font-sans";
  }
  if (level === 1) {
    if (template === "minimal" || template === "compact") {
      return bodyClass;
    }
    return displayClass;
  }
  if (template === "editorial" && level === 3) {
    return displayClass;
  }
  return bodyClass;
}

export function resumeBodyFontClass(preset: ResumeFontPreset): string {
  return fonts(preset).bodyClass;
}

export function resumePaperClasses(
  template: ResumeTemplate,
  className?: string
): string {
  return cn(
    "rounded-sm bg-white text-neutral-900 [color-scheme:light] shadow-[0_2px_24px_rgba(0,0,0,0.12),0_0_1px_rgba(0,0,0,0.08)]",
    "w-full max-w-[612px] mx-auto min-h-[792px] px-10 py-10",
    template === "classic" && "px-12",
    template === "modern" && "px-11 py-11 border border-neutral-200",
    template === "executive" && "px-12 py-12",
    template === "compact" && "px-8 py-8 max-w-[600px] min-h-[720px]",
    template === "editorial" && "px-14 py-12",
    className
  );
}

export function resumeHeadingClasses(
  template: ResumeTemplate,
  level: number,
  preset: ResumeFontPreset
): string {
  const ff = resumeHeadingFontClass(template, level, preset);
  return cn(
    "text-neutral-900",
    ff,
    template === "minimal" &&
      level === 1 &&
      "text-2xl font-normal tracking-tight border-b border-neutral-200 pb-2 mb-3",
    template === "minimal" &&
      level === 2 &&
      "text-sm font-semibold uppercase tracking-widest text-neutral-600 mt-6 mb-2",
    template === "minimal" &&
      level === 3 &&
      "text-base font-semibold mt-3 mb-1",
    template === "classic" &&
      level === 1 &&
      "text-3xl font-semibold text-center mb-1",
    template === "classic" &&
      level === 2 &&
      "text-sm font-bold uppercase border-b border-neutral-300 pb-1 mt-5 mb-2",
    template === "classic" &&
      level === 3 &&
      "text-base font-semibold italic mt-2",
    template === "modern" &&
      level === 1 &&
      "text-3xl font-bold text-neutral-900 mb-2",
    template === "modern" &&
      level === 2 &&
      "text-xs uppercase tracking-[0.2em] text-amber-700 mt-6 mb-2",
    template === "modern" &&
      level === 3 &&
      "text-base font-semibold mt-2",
    template === "executive" &&
      level === 1 &&
      "text-2xl font-semibold tracking-tight border-b-2 border-neutral-300 pb-3 mb-4",
    template === "executive" &&
      level === 2 &&
      "text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-600 mt-7 mb-2",
    template === "executive" &&
      level === 3 &&
      "text-sm font-semibold mt-3 mb-1",
    template === "compact" &&
      level === 1 &&
      "text-xl font-semibold tracking-tight border-b border-neutral-200 pb-1.5 mb-2",
    template === "compact" &&
      level === 2 &&
      "text-[10px] font-bold uppercase tracking-widest text-neutral-600 mt-4 mb-1",
    template === "compact" &&
      level === 3 &&
      "text-sm font-semibold mt-2 mb-0.5",
    template === "editorial" &&
      level === 1 &&
      "text-4xl font-bold tracking-tight leading-none mb-6",
    template === "editorial" &&
      level === 2 &&
      "text-[10px] font-semibold uppercase tracking-[0.28em] text-amber-800/90 mt-9 mb-3",
    template === "editorial" &&
      level === 3 &&
      "text-lg font-medium italic mt-2 mb-1"
  );
}

export function resumeParagraphClasses(
  template: ResumeTemplate,
  preset: ResumeFontPreset
): string {
  const body = resumeBodyFontClass(preset);
  return cn(
    body,
    "leading-relaxed text-neutral-800 mb-2",
    template === "compact" ? "text-xs leading-snug" : "text-sm",
    template === "modern" && "text-[15px] leading-[1.55]"
  );
}

export function resumeListClasses(
  template: ResumeTemplate,
  preset: ResumeFontPreset,
  ordered: boolean
): string {
  const body = resumeBodyFontClass(preset);
  return cn(
    ordered ? "list-decimal" : "list-disc",
    "pl-5 space-y-1 mb-3 text-neutral-800",
    template === "compact" ? "text-xs leading-snug" : "text-sm",
    body,
    template === "modern" && !ordered && "marker:text-amber-600"
  );
}

export function resumeSectionClasses(
  template: ResumeTemplate,
  showSectionDividers: boolean
): string {
  return cn(
    "mb-2",
    showSectionDividers &&
      template !== "minimal" &&
      template !== "compact" &&
      "border-l-2 border-amber-500/50 pl-3",
    showSectionDividers &&
      template === "compact" &&
      "border-l border-amber-500/40 pl-2.5"
  );
}

export const RESUME_TEMPLATE_IDS: ResumeTemplate[] = [
  "minimal",
  "classic",
  "modern",
  "executive",
  "compact",
  "editorial",
];

export const RESUME_TEMPLATE_LABELS: Record<ResumeTemplate, string> = {
  minimal: "Minimal",
  classic: "Classic",
  modern: "Modern",
  executive: "Executive",
  compact: "Compact",
  editorial: "Editorial",
};
