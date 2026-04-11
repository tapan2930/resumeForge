import type { MarginSettings, ResumeTemplate } from "./types";

export const DEFAULT_MARGINS: Record<ResumeTemplate, { horizontal: number; vertical: number }> = {
  minimal: { horizontal: 48, vertical: 48 }, // 0.5in ~ 48px
  classic: { horizontal: 48, vertical: 48 },
  modern: { horizontal: 44, vertical: 44 },
  executive: { horizontal: 48, vertical: 48 },
  compact: { horizontal: 32, vertical: 32 },
  editorial: { horizontal: 56, vertical: 48 },
};

export const MINIMUM_MARGINS = { horizontal: 20, vertical: 20 };
export const NO_MARGINS = { horizontal: 0, vertical: 0 };

export function resolveMargins(
  template: ResumeTemplate | string,
  settings?: MarginSettings
): { horizontal: number; vertical: number } {
  if (!settings || settings.preset === "default") {
    return (
      DEFAULT_MARGINS[template as ResumeTemplate] ?? DEFAULT_MARGINS.minimal
    );
  }
  if (settings.preset === "minimum") {
    return MINIMUM_MARGINS;
  }
  if (settings.preset === "none") {
    return NO_MARGINS;
  }
  return {
    horizontal: settings.horizontal,
    vertical: settings.vertical,
  };
}

export const MARGIN_PRESET_LABELS: Record<string, string> = {
  default: "Default",
  minimum: "Minimum",
  none: "None",
  custom: "Custom",
};
