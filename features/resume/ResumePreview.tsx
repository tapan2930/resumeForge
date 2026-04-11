"use client";

import { useState } from "react";
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
  onNodeClick,
  onNodeHover,
}: {
  content: JSONContent;
  template: ResumeTemplate | string;
  customTemplate?: CustomTemplate;
  margins?: MarginSettings;
  linkSettings?: LinkSettings;
  highlightNode?: string;
  showSectionDividers?: boolean;
  className?: string;
  onNodeClick?: (type: string, path: string) => void;
  onNodeHover?: (type: string | null, path: string | null) => void;
}) {
  const fp = resolveFontPreset(undefined);
  const m = resolveMargins(template as ResumeTemplate, margins);
  const [hoverNodePath, setHoverNodePath] = useState<string | null>(null);

  const html = nodeHtml(content, template, fp, {
    sectionDividers: showSectionDividers,
    linkSettings,
    customTemplate,
    isPreview: true,
  });

  const pageWrapper = customTemplate
    ? `<div data-node-type="page" data-node-path="root" style="display: block; min-height: 100%; cursor: pointer;">${customTemplate.nodes.page.html.replace(
        "{{content}}",
        html
      )}</div>`
    : html;

  const handleMouseMove = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const node = target.closest("[data-node-path]") as HTMLElement;
    if (node) {
      const path = node.getAttribute("data-node-path");
      const type = node.getAttribute("data-node-type");
      if (path !== hoverNodePath) {
        setHoverNodePath(path);
        onNodeHover?.(type, path);
      }
    } else if (hoverNodePath) {
      setHoverNodePath(null);
      onNodeHover?.(null, null);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const node = target.closest("[data-node-path]") as HTMLElement;
    if (node) {
      const path = node.getAttribute("data-node-path");
      const type = node.getAttribute("data-node-type");
      if (path && type) onNodeClick?.(type, path);
    }
  };

  return (
    <div
      className={cn(
        resumePaperClasses(template as ResumeTemplate, className),
        "px-0 py-0 relative group/preview"
      )}
      style={{
        paddingLeft: `${m.horizontal}px`,
        paddingRight: `${m.horizontal}px`,
        paddingTop: `${m.vertical}px`,
        paddingBottom: `${m.vertical}px`,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        setHoverNodePath(null);
        onNodeHover?.(null, null);
      }}
      onClick={handleClick}
      role="document"
      aria-label="Resume preview"
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
        [data-node-type="${highlightNode}"] {
          outline: 2px solid #2563eb !important;
          outline-offset: 2px !important;
          background-color: rgba(37, 99, 235, 0.05) !important;
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1) !important;
          border-radius: 2px !important;
          z-index: 10 !important;
          position: relative !important;
        }
        
        [data-node-path="${hoverNodePath}"]:not([data-node-type="${highlightNode}"]) {
          outline: 1px dashed #3b82f6 !important;
          outline-offset: 1px !important;
          background-color: rgba(59, 130, 246, 0.03) !important;
        }
      `,
        }}
      />
      <div dangerouslySetInnerHTML={{ __html: pageWrapper }} />
    </div>
  );
}
