"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  useEditor,
  EditorContent,
  BubbleMenu,
  type Editor,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import type { JSONContent } from "@tiptap/core";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link2,
  Minus,
  Plus,
  ScanLine,
  Sparkles,
  FileDown,
  Settings2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ResumeSection } from "@/features/resume/extensions/resume-section";
import { CustomNodeAttributes } from "@/features/resume/extensions/custom-node-attributes";
import { sectionTemplates } from "@/lib/default-content";
import { SectionOutline } from "@/features/resume/SectionOutline";
import { cn } from "@/lib/utils";
import { useGemini } from "@/features/ai/useGemini";

const PREVIEW_DEBOUNCE_MS = 300;

export function ResumeEditor({
  content,
  onContentChange,
  onDebouncedPreview,
  onScan,
  onTailor,
  onExportPdf,
  disabledAi,
  onReady,
}: {
  content: JSONContent;
  onContentChange: (json: JSONContent) => void;
  onDebouncedPreview: (json: JSONContent) => void;
  onScan: () => void;
  onTailor: () => void;
  onExportPdf: () => void;
  disabledAi?: boolean;
  onReady?: (editor: Editor) => void;
}) {
  const { hasKey } = useGemini();
  const aiBlocked = disabledAi || !hasKey;
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInternalUpdate = useRef(false);
  const savedSelection = useRef<{ from: number; to: number } | null>(null);
  const [, setOutlineTick] = useState(0);

  const bump = useCallback(() => setOutlineTick((t) => t + 1), []);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        horizontalRule: false,
      }),
      HorizontalRule,
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-amber-500 underline underline-offset-2",
        },
      }),
      Placeholder.configure({
        placeholder: "Write your resume…",
      }),
      ResumeSection,
      CustomNodeAttributes,
    ],
    content,
    editorProps: {
      attributes: {
        class:
          "prose prose-invert prose-sm max-w-none min-h-[480px] px-4 py-4 focus:outline-none font-sans text-foreground",
      },
    },
    onUpdate: ({ editor: ed }) => {
      isInternalUpdate.current = true;
      const json = ed.getJSON();
      onContentChange(json);
      if (previewTimer.current) clearTimeout(previewTimer.current);
      previewTimer.current = setTimeout(() => {
        onDebouncedPreview(json);
      }, PREVIEW_DEBOUNCE_MS);
      bump();
    },
    onTransaction: () => bump(),
    onCreate: ({ editor: ed }) => {
      onReady?.(ed);
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }
    const current = JSON.stringify(editor.getJSON());
    const incoming = JSON.stringify(content);
    if (current !== incoming) {
      editor.commands.setContent(content, false);
    }
  }, [content, editor]);

  useEffect(() => {
    return () => {
      if (previewTimer.current) clearTimeout(previewTimer.current);
    };
  }, []);

  const setLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href;
    const url = window.prompt("URL", prev || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  const insertTemplate = useCallback(
    (key: string) => {
      if (!editor) return;
      const tpl = sectionTemplates[key];
      if (tpl) {
        editor.chain().focus().insertContent(tpl.content).run();
      }
    },
    [editor]
  );

  const setCustomType = (type: string | null) => {
    if (!editor) return;
    const types = [
      "paragraph",
      "heading",
      "bulletList",
      "orderedList",
      "resumeSection",
    ];
    for (const t of types) {
      if (editor.isActive(t)) {
        editor.chain().focus().updateAttributes(t, { customType: type }).run();
        return;
      }
    }
  };

  const onNewCustomType = () => {
    const val = window.prompt(
      "Enter style identifier (e.g., contact-bar, skills-grid, subheader)"
    );
    if (val) setCustomType(val.toLowerCase().trim());
  };

  const handleStyleMenuOpen = useCallback(
    (open: boolean) => {
      if (!editor) return;
      if (open) {
        savedSelection.current = {
          from: editor.state.selection.from,
          to: editor.state.selection.to,
        };
      } else if (savedSelection.current) {
        requestAnimationFrame(() => {
          if (!editor || !savedSelection.current) return;
          editor
            .chain()
            .focus()
            .setTextSelection(savedSelection.current)
            .run();
          savedSelection.current = null;
        });
      }
    },
    [editor]
  );

  if (!editor) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
        Loading editor…
      </div>
    );
  }

  const TB = ({
    onClick,
    active,
    label,
    children,
    disabled,
  }: {
    onClick: () => void;
    active?: boolean;
    label: string;
    children: React.ReactNode;
    disabled?: boolean;
  }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant={active ? "secondary" : "ghost"}
          size="icon"
          className="h-9 w-9 shrink-0"
          onClick={onClick}
          disabled={disabled}
          aria-label={label}
          aria-pressed={active}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );

  return (
      <div className="flex h-full min-h-0 flex-col rounded-lg border border-border bg-card overflow-hidden">
        <div
          className="flex flex-wrap items-center gap-1 border-b border-border bg-background/80 px-2 py-2"
          role="toolbar"
          aria-label="Resume formatting"
        >
          <TB
            label="Heading 1"
            active={editor.isActive("heading", { level: 1 })}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
          >
            <Heading1 className="h-4 w-4" />
          </TB>
          <TB
            label="Heading 2"
            active={editor.isActive("heading", { level: 2 })}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
          >
            <Heading2 className="h-4 w-4" />
          </TB>
          <TB
            label="Heading 3"
            active={editor.isActive("heading", { level: 3 })}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
          >
            <Heading3 className="h-4 w-4" />
          </TB>
          <TB
            label="Bold"
            active={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className="h-4 w-4" />
          </TB>
          <TB
            label="Italic"
            active={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className="h-4 w-4" />
          </TB>
          <TB
            label="Underline"
            active={editor.isActive("underline")}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            <UnderlineIcon className="h-4 w-4" />
          </TB>
          <TB
            label="Bullet list"
            active={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List className="h-4 w-4" />
          </TB>
          <TB
            label="Numbered list"
            active={editor.isActive("orderedList")}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className="h-4 w-4" />
          </TB>
          <TB label="Link" onClick={setLink}>
            <Link2 className="h-4 w-4" />
          </TB>
          <TB
            label="Horizontal rule"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
          >
            <Minus className="h-4 w-4" />
          </TB>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="ml-1 h-9 gap-1 border-border"
                aria-label="Add section from template"
              >
                <Plus className="h-4 w-4" />
                Add section
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {Object.entries(sectionTemplates).map(([key, v]) => (
                <DropdownMenuItem
                  key={key}
                  className="cursor-pointer"
                  onClick={() => insertTemplate(key)}
                >
                  {v.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="ml-auto flex flex-wrap items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className={cn("h-9 gap-1", aiBlocked && "opacity-50")}
                    onClick={onScan}
                    disabled={aiBlocked}
                    aria-label="Scan resume for grammar and ATS"
                  >
                    <ScanLine className="h-4 w-4" />
                    Scan resume
                  </Button>
                </span>
              </TooltipTrigger>
              {aiBlocked && (
                <TooltipContent>Set Gemini API key in Settings</TooltipContent>
              )}
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={cn("h-9 gap-1", aiBlocked && "opacity-50")}
                    onClick={onTailor}
                    disabled={aiBlocked}
                    aria-label="Tailor resume for a job"
                  >
                    <Sparkles className="h-4 w-4" />
                    Tailor for job
                  </Button>
                </span>
              </TooltipTrigger>
              {aiBlocked && (
                <TooltipContent>Set Gemini API key in Settings</TooltipContent>
              )}
            </Tooltip>
            <Button
              type="button"
              variant="default"
              size="sm"
              className="h-9 gap-1"
              onClick={onExportPdf}
              aria-label="Download PDF"
            >
              <FileDown className="h-4 w-4" />
              PDF
            </Button>
          </div>
        </div>

        <SectionOutline editor={editor} />

        <div className="min-h-0 flex-1 overflow-y-auto">
          {editor && (
            <BubbleMenu
              editor={editor}
              tippyOptions={{ duration: 100 }}
              shouldShow={({ editor }) =>
                editor.isActive("paragraph") ||
                editor.isActive("heading") ||
                editor.isActive("bulletList") ||
                editor.isActive("orderedList") ||
                editor.isActive("resumeSection")
              }
            >
              <div className="relative flex items-center gap-1 rounded-lg border border-border bg-card p-1 shadow-xl">
                <div className="px-2 text-[10px] uppercase font-bold text-muted-foreground tracking-wider border-r border-border mr-1">
                  Style Type
                </div>
                <DropdownMenu modal={false} onOpenChange={handleStyleMenuOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1 px-2 text-xs"
                    >
                      <Settings2 className="h-3 w-3" />
                      {(() => {
                        const ct =
                          editor.getAttributes("paragraph").customType ||
                          editor.getAttributes("heading").customType ||
                          editor.getAttributes("bulletList").customType ||
                          editor.getAttributes("orderedList").customType ||
                          editor.getAttributes("resumeSection").customType ||
                          editor.getAttributes("resumeSection").sectionType ||
                          "default";
                        return String(ct);
                      })()}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    portaled={false}
                    align="start"
                    className="w-40 !duration-0 data-[state=closed]:animate-none"
                    onCloseAutoFocus={(e) => e.preventDefault()}
                  >
                    <DropdownMenuItem
                      className="cursor-pointer text-xs"
                      onClick={() => setCustomType(null)}
                    >
                      default
                    </DropdownMenuItem>
                    {[
                      "summary",
                      "work",
                      "education",
                      "skills",
                      "projects",
                      "certifications",
                      "contact-bar",
                    ].map((t) => (
                      <DropdownMenuItem
                        key={t}
                        className="cursor-pointer text-xs"
                        onClick={() => setCustomType(t)}
                      >
                        {t}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuItem
                      className="cursor-pointer text-xs font-semibold text-primary"
                      onClick={onNewCustomType}
                    >
                      + New Style Tag
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </BubbleMenu>
          )}
          <EditorContent editor={editor} />
        </div>
      </div>
  );
}
