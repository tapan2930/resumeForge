import type { ResumeFontPreset } from "@/lib/types";

export const DEFAULT_RESUME_FONT_PRESET: ResumeFontPreset = "lora_playfair";

/** Typography pairing for resume body + display headings (preview + PDF). */
export const RESUME_FONT_PRESETS: Record<
  ResumeFontPreset,
  {
    label: string;
    /** Tailwind font family class for body / most headings */
    bodyClass: string;
    /** Tailwind font family class for prominent titles (H1) where template uses display */
    displayClass: string;
    /** CSS font-family for PDF body text */
    pdfBody: string;
    /** CSS font-family for PDF display headings */
    pdfDisplay: string;
  }
> = {
  lora_playfair: {
    label: "Lora + Playfair Display",
    bodyClass: "font-resume",
    displayClass: "font-display",
    pdfBody: "'Lora', Georgia, serif",
    pdfDisplay: "'Playfair Display', Georgia, serif",
  },
  merriweather_cinzel: {
    label: "Merriweather + Cinzel",
    bodyClass: "font-resume-mw",
    displayClass: "font-display-cz",
    pdfBody: "'Merriweather', Georgia, serif",
    pdfDisplay: "'Cinzel', Georgia, serif",
  },
  source_serif: {
    label: "Source Serif 4 (uniform)",
    bodyClass: "font-resume-ss",
    displayClass: "font-display-ss",
    pdfBody: "'Source Serif 4', Georgia, serif",
    pdfDisplay: "'Source Serif 4', Georgia, serif",
  },
  ibm_plex_serif: {
    label: "IBM Plex Serif (uniform)",
    bodyClass: "font-resume-ibm",
    displayClass: "font-display-ibm",
    pdfBody: "'IBM Plex Serif', Georgia, serif",
    pdfDisplay: "'IBM Plex Serif', Georgia, serif",
  },
  crimson_fraunces: {
    label: "Crimson Pro + Fraunces",
    bodyClass: "font-resume-cr",
    displayClass: "font-display-fr",
    pdfBody: "'Crimson Pro', Georgia, serif",
    pdfDisplay: "'Fraunces', Georgia, serif",
  },
};

export const RESUME_FONT_PRESET_ORDER: ResumeFontPreset[] = [
  "lora_playfair",
  "merriweather_cinzel",
  "source_serif",
  "ibm_plex_serif",
  "crimson_fraunces",
];

export function resolveFontPreset(
  preset: ResumeFontPreset | undefined | null
): ResumeFontPreset {
  if (preset && preset in RESUME_FONT_PRESETS) return preset;
  return DEFAULT_RESUME_FONT_PRESET;
}

/** Single Google Fonts URL for PDF (loads all families). */
export const RESUME_PDF_GOOGLE_FONTS_HREF =
  "https://fonts.googleapis.com/css2?" +
  [
    "family=Cinzel:wght@500;600;700",
    "family=Crimson+Pro:ital,wght@0,400;0,600;1,400",
    "family=Fraunces:ital,wght@0,500;0,600;0,700;1,500",
    "family=IBM+Plex+Serif:ital,wght@0,400;0,600;1,400",
    "family=Lora:ital,wght@0,400;0,600;1,400",
    "family=Merriweather:ital,wght@0,400;0,700;1,400",
    "family=Playfair+Display:ital,wght@0,600;0,700;1,600",
    "family=Source+Serif+4:ital,wght@0,400;0,600;1,400",
  ].join("&") +
  "&display=swap";
