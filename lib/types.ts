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

export interface NodeTemplate {
  html: string; // e.g., "<h1 style='color: blue;'>{{content}}</h1>"
}

export interface CustomTemplate {
  id: string;
  name: string;
  nodes: {
    h1: NodeTemplate;
    h2: NodeTemplate;
    h3: NodeTemplate;
    p: NodeTemplate;
    ul: NodeTemplate;
    ol: NodeTemplate;
    li: NodeTemplate;
    hr: NodeTemplate;
    section: NodeTemplate; // Default section
    page: NodeTemplate; // Outer wrapper
    overrides: Record<string, NodeTemplate>; // e.g. "p:contact-bar", "ul:skills-grid"
  };
  createdAt: string;
  updatedAt: string;
}

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
  template: ResumeTemplate | string;
  margins?: MarginSettings;
  linkSettings?: LinkSettings;
  avoidSectionBreaks?: boolean;
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

export type MarginPreset = "default" | "minimum" | "none" | "custom";

export interface MarginSettings {
  preset: MarginPreset;
  horizontal: number; // px
  vertical: number; // px
}

export interface LinkSettings {
  color: string;
  underline: boolean;
}

export interface PDFExportOptions {
  paperSize: PaperSize;
  margins?: MarginSettings;
  linkSettings?: LinkSettings;
  includeHeader: boolean;
  includePageNumbers: boolean;
  includeSectionDividers: boolean;
  avoidSectionBreaks: boolean;
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
