import type { JSONContent } from "@tiptap/core";

export interface ResumeFolder {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export type ResumeTemplate =
  | "minimal"
  | "classic"
  | "modern"
  | "executive"
  | "compact"
  | "editorial";

/** Body + display pairing for resume preview and PDF. */
export type ResumeFontPreset =
  | "lora_playfair"
  | "merriweather_cinzel"
  | "source_serif"
  | "ibm_plex_serif"
  | "crimson_fraunces";

export interface ResumeVersion {
  id: string;
  folderId: string;
  title: string;
  content: JSONContent;
  template: ResumeTemplate;
  atsScore: number | null;
  grammarScore: number | null;
  isTailored: boolean;
  jobTitle?: string;
  companyName?: string;
  relevanceScore?: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export type PaperSize = "letter" | "a4";

export interface PDFExportOptions {
  paperSize: PaperSize;
  includeHeader: boolean;
  includePageNumbers: boolean;
  includeSectionDividers: boolean;
  fileName: string;
}

export const FOLDER_COLORS = [
  "#F59E0B",
  "#EF4444",
  "#22C55E",
  "#3B82F6",
  "#A855F7",
  "#EC4899",
  "#14B8A6",
  "#94A3B8",
] as const;
