"use client";

import type { JSONContent } from "@tiptap/core";
import type { ResumeFontPreset, ResumeTemplate } from "@/lib/types";
import { resolveFontPreset } from "@/lib/resume-fonts";
import {
  resumeBodyFontClass,
  resumeHeadingClasses,
  resumeListClasses,
  resumePaperClasses,
  resumeParagraphClasses,
  resumeSectionClasses,
} from "@/lib/resume-template-styles";
import { cn } from "@/lib/utils";

function Marks({
  marks,
  children,
}: {
  marks?: JSONContent["marks"];
  children: React.ReactNode;
}) {
  let el: React.ReactNode = children;
  if (!marks?.length) return <>{el}</>;
  for (const m of marks) {
    if (m.type === "bold") {
      el = <strong className="font-semibold">{el}</strong>;
    } else if (m.type === "italic") {
      el = <em>{el}</em>;
    } else if (m.type === "underline") {
      el = <span className="underline">{el}</span>;
    } else if (m.type === "link" && m.attrs?.href) {
      el = (
        <a
          href={String(m.attrs.href)}
          className="text-canvas-foreground/80 underline underline-offset-2"
        >
          {el}
        </a>
      );
    }
  }
  return <>{el}</>;
}

function NodeView({
  node,
  template,
  fontPreset,
  showSectionDividers,
}: {
  node: JSONContent;
  template: ResumeTemplate;
  fontPreset: ResumeFontPreset;
  showSectionDividers?: boolean;
}) {
  const fp = resolveFontPreset(fontPreset);
  const kids = node.content?.map((c, i) => (
    <NodeView
      key={i}
      node={c}
      template={template}
      fontPreset={fp}
      showSectionDividers={showSectionDividers}
    />
  ));

  switch (node.type) {
    case "doc":
      return <div className="resume-doc">{kids}</div>;
    case "text":
      return <Marks marks={node.marks}>{node.text ?? ""}</Marks>;
    case "heading": {
      const level = (node.attrs?.level as number) ?? 1;
      const Tag = level === 1 ? "h1" : level === 2 ? "h2" : "h3";
      return (
        <Tag className={resumeHeadingClasses(template, level, fp)}>
          {kids}
        </Tag>
      );
    }
    case "paragraph":
      return (
        <p className={resumeParagraphClasses(template, fp)}>{kids}</p>
      );
    case "bulletList":
      return (
        <ul className={resumeListClasses(template, fp, false)}>{kids}</ul>
      );
    case "orderedList":
      return (
        <ol className={resumeListClasses(template, fp, true)}>{kids}</ol>
      );
    case "listItem":
      return <li>{kids}</li>;
    case "horizontalRule":
      return (
        <hr
          className={cn(
            "my-4 border-canvas-foreground/20",
            showSectionDividers === false && "hidden"
          )}
        />
      );
    case "resumeSection":
      return (
        <section
          className={resumeSectionClasses(
            template,
            !!showSectionDividers
          )}
          data-section-type={String(node.attrs?.sectionType ?? "")}
        >
          {kids}
        </section>
      );
    default:
      return (
        <div className={cn(resumeBodyFontClass(fp), "text-sm")}>{kids}</div>
      );
  }
}

export function ResumePreview({
  content,
  template,
  fontPreset,
  showSectionDividers = true,
  className,
}: {
  content: JSONContent;
  template: ResumeTemplate;
  fontPreset?: ResumeFontPreset | null;
  showSectionDividers?: boolean;
  className?: string;
}) {
  const fp = resolveFontPreset(fontPreset);
  return (
    <div
      className={resumePaperClasses(template, className)}
      role="document"
      aria-label="Resume preview"
    >
      <NodeView
        node={content}
        template={template}
        fontPreset={fp}
        showSectionDividers={showSectionDividers}
      />
    </div>
  );
}
