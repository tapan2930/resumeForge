"use client";

import type { JSONContent } from "@tiptap/core";
import type {
  CustomTemplate,
  LinkSettings,
  MarginSettings,
  ResumeFontPreset,
  ResumeTemplate,
} from "@/lib/types";
import { resolveFontPreset } from "@/lib/resume-fonts";
import { resumePaperClasses } from "@/lib/resume-template-styles";
import { cn } from "@/lib/utils";
import { resolveMargins } from "@/lib/margins";
import { nodeHtml } from "@/lib/render-pdf-html";

export function ResumePreview({
  content,
  template,
  customTemplate,
  margins,
  linkSettings,
  highlightNode,
  showSectionDividers = true,
  className,
}: {
  content: JSONContent;
  template: ResumeTemplate | string;
  customTemplate?: CustomTemplate;
  margins?: MarginSettings;
  linkSettings?: LinkSettings;
  highlightNode?: string;
  showSectionDividers?: boolean;
  className?: string;
}) {
  const fp = resolveFontPreset(undefined);
  const m = resolveMargins(template as ResumeTemplate, margins);

  const html = nodeHtml(content, template, fp, {
    sectionDividers: showSectionDividers,
    linkSettings,
    customTemplate,
    isPreview: true,
  });

  const pageWrapper = customTemplate
    ? `<div data-node-type="page" style="display: block; min-height: 100%;">${customTemplate.nodes.page.html.replace("{{content}}", html)}</div>`
    : html;

  return (
    <div
      className={cn(
        resumePaperClasses(template as ResumeTemplate, className),
        "px-0 py-0"
      )}
      style={{
        paddingLeft: `${m.horizontal}px`,
        paddingRight: `${m.horizontal}px`,
        paddingTop: `${m.vertical}px`,
        paddingBottom: `${m.vertical}px`,
      }}
      role="document"
      aria-label="Resume preview"
    >
      <style dangerouslySetInnerHTML={{ __html: `
        [data-node-type="${highlightNode}"] {
          outline: 2px solid #2563eb !important;
          outline-offset: 2px !important;
          background-color: rgba(37, 99, 235, 0.05) !important;
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1) !important;
          border-radius: 2px !important;
          z-index: 10 !important;
          position: relative !important;
        }
      `}} />
      <div dangerouslySetInnerHTML={{ __html: pageWrapper }} />
    </div>
  );
}
