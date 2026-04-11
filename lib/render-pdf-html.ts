import type { JSONContent } from "@tiptap/core";
import type {
  MarginSettings,
  PaperSize,
  ResumeFontPreset,
  ResumeTemplate,
} from "@/lib/types";
import {
  RESUME_FONT_PRESETS,
  RESUME_PDF_GOOGLE_FONTS_HREF,
  resolveFontPreset,
} from "@/lib/resume-fonts";
import { resolveMargins } from "@/lib/margins";

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function marksHtml(
  marks: JSONContent["marks"] | undefined,
  text: string,
  linkSettings?: LinkSettings
): string {
  let out = esc(text);
  if (!marks?.length) return out;
  for (const m of marks) {
    if (m.type === "bold") out = `<strong>${out}</strong>`;
    else if (m.type === "italic") out = `<em>${out}</em>`;
    else if (m.type === "underline")
      out = `<span style="text-decoration:underline">${out}</span>`;
    else if (m.type === "link" && m.attrs?.href) {
      const color = linkSettings?.color || "inherit";
      const decoration =
        linkSettings?.underline !== false ? "underline" : "none";
      out = `<a href="${esc(
        String(m.attrs.href)
      )}" style="color:${color};text-decoration:${decoration}">${out}</a>`;
    }
  }
  return out;
}

function pdfHeadingFontFamily(
  template: ResumeTemplate,
  level: number,
  body: string,
  display: string
): string {
  if (template === "modern" && level === 2) {
    return "'Inter',system-ui,sans-serif";
  }
  if (level === 1) {
    if (template === "minimal" || template === "compact") return body;
    return display;
  }
  if (level === 3 && template === "editorial") return display;
  return body;
}

function pdfHeadingStyle(
  template: ResumeTemplate,
  level: number,
  body: string,
  display: string
): string {
  const font = pdfHeadingFontFamily(template, level, body, display);
  const base = `margin:0;color:#1a1a1a;font-family:${font};`;

  if (template === "minimal") {
    if (level === 1)
      return `${base}font-size:22px;font-weight:400;letter-spacing:-0.02em;border-bottom:1px solid #ddd;padding-bottom:8px;margin-bottom:12px;`;
    if (level === 2)
      return `${base}font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.12em;margin-top:22px;margin-bottom:8px;color:#444;`;
    return `${base}font-size:15px;font-weight:600;margin-top:10px;margin-bottom:4px;`;
  }
  if (template === "classic") {
    if (level === 1)
      return `${base}font-size:28px;font-weight:600;text-align:center;margin-bottom:6px;`;
    if (level === 2)
      return `${base}font-size:12px;font-weight:700;text-transform:uppercase;border-bottom:1px solid #ccc;padding-bottom:4px;margin-top:18px;margin-bottom:8px;`;
    return `${base}font-size:15px;font-weight:600;font-style:italic;margin-top:8px;`;
  }
  if (template === "modern") {
    if (level === 1)
      return `${base}font-size:28px;font-weight:700;margin-bottom:8px;`;
    if (level === 2)
      return `${base}font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.18em;color:#b45309;margin-top:22px;margin-bottom:8px;`;
    return `${base}font-size:15px;font-weight:600;margin-top:8px;`;
  }
  if (template === "executive") {
    if (level === 1)
      return `${base}font-size:24px;font-weight:600;letter-spacing:-0.02em;border-bottom:2px solid #ccc;padding-bottom:10px;margin-bottom:14px;`;
    if (level === 2)
      return `${base}font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.2em;color:#444;margin-top:26px;margin-bottom:8px;`;
    return `${base}font-size:13px;font-weight:600;margin-top:10px;margin-bottom:4px;`;
  }
  if (template === "compact") {
    if (level === 1)
      return `${base}font-size:18px;font-weight:600;letter-spacing:-0.02em;border-bottom:1px solid #ddd;padding-bottom:4px;margin-bottom:8px;`;
    if (level === 2)
      return `${base}font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.14em;color:#555;margin-top:14px;margin-bottom:4px;`;
    return `${base}font-size:12px;font-weight:600;margin-top:6px;margin-bottom:3px;`;
  }
  /* editorial */
  if (level === 1)
    return `${base}font-size:36px;font-weight:700;letter-spacing:-0.03em;line-height:1.05;margin-bottom:22px;`;
  if (level === 2)
    return `${base}font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.28em;color:#92400e;margin-top:32px;margin-bottom:10px;`;
  return `${base}font-size:17px;font-weight:500;font-style:italic;margin-top:6px;margin-bottom:4px;`;
}

function pdfParagraphStyle(
  template: ResumeTemplate,
  bodyFont: string
): string {
  const compact = template === "compact";
  return `margin:0 0 ${compact ? "6px" : "8px"};font-family:${bodyFont};font-size:${compact ? "11px" : "13px"};line-height:${compact ? "1.35" : "1.55"};color:#222;`;
}

function pdfListStyle(template: ResumeTemplate, bodyFont: string): string {
  const compact = template === "compact";
  return `margin:0 0 12px;padding-left:20px;font-family:${bodyFont};font-size:${compact ? "11px" : "13px"};line-height:${compact ? "1.35" : "1.45"};color:#222;`;
}

function nodeHtml(
  node: JSONContent,
  template: ResumeTemplate,
  fontPreset: ResumeFontPreset,
  opts: { sectionDividers: boolean; linkSettings?: LinkSettings }
): string {
  const kids =
    node.content?.map((c) => nodeHtml(c, template, fontPreset, opts)).join("") ??
    "";

  const fp = resolveFontPreset(fontPreset);
  const { pdfBody, pdfDisplay } = RESUME_FONT_PRESETS[fp];

  switch (node.type) {
    case "doc":
      return kids;
    case "text":
      return marksHtml(node.marks, node.text ?? "", opts.linkSettings);
    case "heading": {
      const level = (node.attrs?.level as number) ?? 1;
      const styles = pdfHeadingStyle(template, level, pdfBody, pdfDisplay);
      const tag = level === 1 ? "h1" : level === 2 ? "h2" : "h3";
      return `<${tag} style="${styles}">${kids}</${tag}>`;
    }
    case "paragraph":
      return `<p style="${pdfParagraphStyle(template, pdfBody)}">${kids}</p>`;
    case "bulletList":
      return `<ul style="${pdfListStyle(template, pdfBody)}">${kids}</ul>`;
    case "orderedList":
      return `<ol style="${pdfListStyle(template, pdfBody)}">${kids}</ol>`;
    case "listItem":
      return `<li style="margin-bottom:4px;">${kids}</li>`;
    case "horizontalRule":
      if (!opts.sectionDividers) return "";
      return `<hr style="border:none;border-top:1px solid #ddd;margin:16px 0;" />`;
    case "resumeSection": {
      const thick = template !== "minimal" && template !== "compact";
      const border =
        opts.sectionDividers && thick
          ? "border-left:3px solid #f59e0b;padding-left:12px;margin-bottom:8px;"
          : opts.sectionDividers && template === "compact"
            ? "border-left:1px solid #f59e0b;padding-left:10px;margin-bottom:8px;"
            : "margin-bottom:8px;";
      return `<section style="${border}">${kids}</section>`;
    }
    default:
      return `<div style="font-family:${pdfBody};font-size:13px;">${kids}</div>`;
  }
}

export function buildResumePdfHtml(params: {
  content: JSONContent;
  template: ResumeTemplate;
  fontPreset?: ResumeFontPreset | null;
  margins?: MarginSettings;
  linkSettings?: LinkSettings;
  paperSize: PaperSize;
  includeHeader: boolean;
  includeSectionDividers: boolean;
  headerName?: string;
}): string {
  const {
    content,
    template,
    fontPreset,
    margins,
    linkSettings,
    paperSize,
    includeHeader,
    includeSectionDividers,
    headerName,
  } = params;

  const fp = resolveFontPreset(fontPreset);
  const m = resolveMargins(template, margins);

  const body = nodeHtml(content, template, fp, {
    sectionDividers: includeSectionDividers,
    linkSettings,
  });

  const pageSize = paperSize === "a4" ? "A4" : "Letter";

  const headerBlock =
    includeHeader && headerName
      ? `<header style="font-family:'Inter',system-ui,sans-serif;font-size:10px;color:#666;margin-bottom:12px;border-bottom:1px solid #eee;padding-bottom:6px;">${esc(headerName)}</header>`
      : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<link href="${RESUME_PDF_GOOGLE_FONTS_HREF}" rel="stylesheet"/>
<style>
  @page { size: ${pageSize}; margin: 0; }
  html { color-scheme: only light; }
  html, body { margin: 0; padding: 0; background: #ffffff; }
  .page { 
    box-sizing: border-box; 
    padding: ${m.vertical}px ${m.horizontal}px; 
    min-height: 100vh; 
    color: #1a1a1a; 
    background: #ffffff; 
  }
</style>
</head>
<body>
  <div class="page">
    ${headerBlock}
    <main>${body}</main>
  </div>
</body>
</html>`;
}
