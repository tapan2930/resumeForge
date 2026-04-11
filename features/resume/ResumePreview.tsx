"use client";

import type { JSONContent } from "@tiptap/core";
import type {
  LinkSettings,
  MarginSettings,
  ResumeFontPreset,
  ResumeTemplate,
} from "@/lib/types";
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
import { resolveMargins } from "@/lib/margins";

function Marks({
  marks,
  linkSettings,
  children,
}: {
  marks?: JSONContent["marks"];
  linkSettings?: LinkSettings;
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
          className={cn(
            linkSettings?.underline !== false && "underline underline-offset-2"
          )}
          style={{ color: linkSettings?.color || "inherit" }}
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
  linkSettings,
  showSectionDividers,
}: {
  node: JSONContent;
  template: ResumeTemplate;
  fontPreset: ResumeFontPreset;
  linkSettings?: LinkSettings;
  showSectionDividers?: boolean;
}) {
  const fp = resolveFontPreset(fontPreset);
  const kids = node.content?.map((c, i) => (
    <NodeView
      key={i}
      node={c}
      template={template}
      fontPreset={fp}
      linkSettings={linkSettings}
      showSectionDividers={showSectionDividers}
    />
  ));

  switch (node.type) {
    case "doc":
      return <div className="resume-doc text-neutral-900">{kids}</div>;
    case "text":
      return (
        <Marks marks={node.marks} linkSettings={linkSettings}>
          {node.text ?? ""}
        </Marks>
      );
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
      return <li className="text-neutral-800">{kids}</li>;
    case "horizontalRule":
      return (
        <hr
          className={cn(
            "my-4 border-neutral-200",
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
        <div className={cn(resumeBodyFontClass(fp), "text-sm text-neutral-800")}>
          {kids}
        </div>
      );
  }
}

export function ResumePreview({
  content,
  template,
  margins,
  linkSettings,
  showSectionDividers = true,
  className,
}: {
  content: JSONContent;
  template: ResumeTemplate;
  margins?: MarginSettings;
  linkSettings?: LinkSettings;
  showSectionDividers?: boolean;
  className?: string;
}) {
  const fp = resolveFontPreset(undefined);
  const m = resolveMargins(template, margins);

  return (
    <div
      className={cn(resumePaperClasses(template, className), "px-0 py-0")}
      style={{
        paddingLeft: `${m.horizontal}px`,
        paddingRight: `${m.horizontal}px`,
        paddingTop: `${m.vertical}px`,
        paddingBottom: `${m.vertical}px`,
      }}
      role="document"
      aria-label="Resume preview"
    >
      <NodeView
        node={content}
        template={template}
        fontPreset={fp}
        linkSettings={linkSettings}
        showSectionDividers={showSectionDividers}
      />
    </div>
  );
}
