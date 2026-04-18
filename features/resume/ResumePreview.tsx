"use client";

import { useEffect, useRef, useState } from "react";
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
import extractBgColor from "@/lib/extract-bg-color";

/* US Letter at 96 DPI: 816 x 1056 px.
   The preview container is max-width 612px (75% scale visually),
   so we scale the page height proportionally: 1056 * (612/816) ≈ 792px.
   We use the full 792px as the total page "slot" including margins. */
const PAGE_WIDTH = 612; // px – matches max-w-[612px] in resumePaperClasses
const PAGE_HEIGHT = 792; // px – proportional letter-height at preview scale

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
  const [pageCount, setPageCount] = useState(1);
  const measurerRef = useRef<HTMLDivElement>(null);

  const html = nodeHtml(content, template, fp, {
    sectionDividers: showSectionDividers,
    linkSettings,
    customTemplate,
    isPreview: true,
  });

  const pageBgColor = extractBgColor(customTemplate?.nodes.page.html || "");
  const pageWrapper = customTemplate
    ? `<div data-node-type="page" data-node-path="root" style="display: block; min-height: 100%; cursor: pointer;">${customTemplate.nodes.page.html.replace(
      "{{content}}",
      html
    )}</div>`
    : html;

  // Content height available per page (total page height minus top+bottom margins)
  const contentHeight = PAGE_HEIGHT - m.vertical * 2;

  // Measure total content height and calculate page count
  useEffect(() => {
    const el = measurerRef.current;
    if (!el) return;
    // Use ResizeObserver for dynamic re-measurement
    const observer = new ResizeObserver(() => {
      const h = el.scrollHeight;
      const pages = Math.max(1, Math.ceil(h / contentHeight));
      setPageCount(pages);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [contentHeight, pageWrapper]);

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

  const highlightStyles = `
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
  `;

  const pageStyle: React.CSSProperties = {
    paddingLeft: `${m.horizontal}px`,
    paddingRight: `${m.horizontal}px`,
    paddingTop: `${m.vertical}px`,
    paddingBottom: `${m.vertical}px`,
  };

  return (
    <div className="flex flex-col items-center gap-0">
      {/* Hidden measurer — renders full content to calculate true height */}
      <div
        ref={measurerRef}
        aria-hidden
        className="absolute pointer-events-none opacity-0"
        style={{
          width: `${PAGE_WIDTH - m.horizontal * 2}px`,
          // no height constraint — let it flow naturally
        }}
        dangerouslySetInnerHTML={{ __html: pageWrapper }}
      />

      <style dangerouslySetInnerHTML={{ __html: highlightStyles }} />

      {Array.from({ length: pageCount }, (_, pageIdx) => (
        <div key={pageIdx} className="flex flex-col items-center w-full">
          {/* Page break divider (between pages, not before first) */}
          {pageIdx > 0 && (
            <div className="w-full max-w-[612px] mx-auto flex items-center gap-3 py-3">
              <div className="flex-1 border-t border-dashed border-zinc-400/60" />
              <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-medium select-none whitespace-nowrap">
                Page {pageIdx + 1}
              </span>
              <div className="flex-1 border-t border-dashed border-zinc-400/60" />
            </div>
          )}

          {/* Page container */}
          <div
            className={cn(
              resumePaperClasses(template as ResumeTemplate, className),
              "px-0 py-0 relative group/preview overflow-hidden"
            )}
            style={{
              ...pageStyle,
              backgroundColor: pageBgColor,
              height: `${PAGE_HEIGHT}px`,
              minHeight: `${PAGE_HEIGHT}px`,
              maxHeight: `${PAGE_HEIGHT}px`,
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => {
              setHoverNodePath(null);
              onNodeHover?.(null, null);
            }}
            onClick={handleClick}
            role="document"
            aria-label={`Resume preview page ${pageIdx + 1}`}
          >
            {/* Content, shifted upward by pageIdx * contentHeight */}
            <div
              style={{
                marginTop: `-${pageIdx * contentHeight}px`,
                // Make tall enough for all content but clip is handled by overflow:hidden on parent
                minHeight: `${pageCount * contentHeight}px`,
              }}
              dangerouslySetInnerHTML={{ __html: pageWrapper }}
            />
          </div>
        </div>
      ))}

      {/* Page count footer */}
      {pageCount > 1 && (
        <div className="mt-2 text-[10px] text-zinc-400 select-none">
          {pageCount} pages
        </div>
      )}
    </div>
  );
}
