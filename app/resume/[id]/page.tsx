"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import type { Editor } from "@tiptap/react";
import type { JSONContent } from "@tiptap/core";
import { toast } from "sonner";
import {
  ArrowLeft,
  Check,
  Loader2,
  FileDown,
  Edit2,
  Layout,
  Link as LinkIcon,
  Pencil,
  Settings2,
} from "lucide-react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { useAppStore, inferDefaultPdfName } from "@/stores/useAppStore";
import { ResumeEditor } from "@/features/resume/ResumeEditor";
import { ResumePreview } from "@/features/resume/ResumePreview";
import {
  ATSScorePanel,
  type AtsTip,
  type GrammarIssue,
} from "@/features/resume/ATSScorePanel";
import { JobMatchModal } from "@/features/resume/JobMatchModal";
import { PDFExportModal } from "@/features/pdf/PDFExportModal";
import { AppShell } from "@/components/app-shell";
import { CommandPaletteHost } from "@/components/command-palette";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { generateJson } from "@/features/ai/gemini";
import {
  ATS_SYSTEM,
  ATS_USER,
  GRAMMAR_SYSTEM,
  GRAMMAR_USER,
} from "@/lib/prompts";
import { getGeminiApiKey, getResolvedGeminiModel } from "@/lib/storage";
import {
  clientAtsSignals,
  replaceFirstTextInDoc,
  tiptapToPlainText,
} from "@/lib/tiptap-helpers";
import { extractResumeName } from "@/lib/extract-name";
import { generateId } from "@/lib/utils";
import type {
  LinkSettings,
  MarginSettings,
  MarginPreset,
  ResumeTemplate,
  ResumeVersion,
} from "@/lib/types";
import {
  RESUME_TEMPLATE_IDS,
  RESUME_TEMPLATE_LABELS,
} from "@/lib/resume-template-styles";
import { useGemini } from "@/features/ai/useGemini";
import { MARGIN_PRESET_LABELS } from "@/lib/margins";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { getBuiltInTemplateAsCustom } from "@/lib/built-in-templates";

type GrammarResponse = {
  grammarScore: number;
  issues: Omit<GrammarIssue, "id">[];
};

type AtsResponse = {
  atsScore: number;
  tips: { title: string; detail: string; severity: AtsTip["severity"] }[];
};

export default function ResumePage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const folders = useAppStore((s) => s.folders);
  const customTemplates = useAppStore((s) => s.customTemplates);
  const importCustomTemplate = useAppStore((s) => s.importCustomTemplate);
  const updateVersion = useAppStore((s) => s.updateVersion);

  const [version, setVersion] = useState<ResumeVersion | null>(null);
  const [content, setContent] = useState<JSONContent | null>(null);
  const [previewContent, setPreviewContent] = useState<JSONContent | null>(
    null
  );
  const [template, setTemplate] = useState<ResumeTemplate | string>("minimal");
  const [margins, setMargins] = useState<MarginSettings>({
    preset: "default",
    horizontal: 48,
    vertical: 48,
  });
  const [linkSettings, setLinkSettings] = useState<LinkSettings>({
    color: "#1a1a1a",
    underline: true,
  });
  const [loading, setLoading] = useState(true);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState("");

  const [scanOpen, setScanOpen] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [grammarScore, setGrammarScore] = useState<number | null>(null);
  const [issues, setIssues] = useState<GrammarIssue[]>([]);
  const [atsScore, setAtsScore] = useState<number | null>(null);
  const [tips, setTips] = useState<AtsTip[]>([]);

  const [jobOpen, setJobOpen] = useState(false);
  const [pdfOpen, setPdfOpen] = useState(false);

  const editorRef = useRef<Editor | null>(null);
  const saveTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const { hasKey } = useGemini();

  const activeCustomTemplate = useMemo(
    () => customTemplates.find((t) => t.id === template),
    [customTemplates, template]
  );

  const onCustomizeBuiltIn = async (builtInId: ResumeTemplate) => {
    try {
      const data = getBuiltInTemplateAsCustom(builtInId);
      const t = await importCustomTemplate(data);
      setTemplate(t.id);
      setVersion((prev) => (prev ? { ...prev, template: t.id } : prev));
      toast.success(`Created "${t.name}" based on built-in`);
    } catch (e) {
      toast.error("Failed to customize template");
    }
  };

  const folder = useMemo(
    () => folders.find((f) => f.id === version?.folderId),
    [folders, version?.folderId]
  );

  const persist = useCallback(
    async (
      v: ResumeVersion,
      json: JSONContent,
      tmpl: ResumeTemplate | string,
      m: MarginSettings,
      ls: LinkSettings
    ) => {
      if (!v) return;
      setSaving(true);
      try {
        await updateVersion(v.id, {
          content: json,
          template: tmpl,
          margins: m,
          linkSettings: ls,
        });
        setSavedAt(new Date().toISOString());
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Save failed");
      } finally {
        setSaving(false);
      }
    },
    [updateVersion]
  );

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    void (async () => {
      const v = await useAppStore.getState().getVersionById(id);
      if (cancelled) return;
      if (!v) {
        toast.error("Resume not found");
        router.push("/");
        return;
      }
      setVersion(v);
      setTitleValue(v.title);
      setContent(v.content);
      setPreviewContent(v.content);
      setTemplate(v.template);
      if (v.margins) setMargins(v.margins);
      if (v.linkSettings) setLinkSettings(v.linkSettings);
      setGrammarScore(v.grammarScore);
      setAtsScore(v.atsScore);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
    // Only re-load when the resume id changes. Do not depend on `router` or store
    // action refs — re-running would reset template from IDB over local edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- router.push stable; omit to avoid loops
  }, [id]);

  const handleRename = useCallback(async () => {
    if (!version || !titleValue.trim()) {
      setTitleValue(version?.title ?? "");
      setIsEditingTitle(false);
      return;
    }
    if (titleValue === version.title) {
      setIsEditingTitle(false);
      return;
    }
    try {
      await updateVersion(version.id, { title: titleValue.trim() });
      setVersion((v) => (v ? { ...v, title: titleValue.trim() } : v));
      setIsEditingTitle(false);
    } catch (e) {
      toast.error("Rename failed");
    }
  }, [version, titleValue, updateVersion]);

  const doSave = useCallback(async () => {
    if (!version || !content) return;
    await persist(version, content, template, margins, linkSettings);
  }, [version, content, template, margins, linkSettings, persist]);

  useEffect(() => {
    if (!version || loading) return;
    saveTimer.current = setInterval(() => {
      void doSave();
    }, 30_000);
    return () => {
      if (saveTimer.current) clearInterval(saveTimer.current);
    };
  }, [version, loading, doSave]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void doSave();
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "p") {
        e.preventDefault();
        setPdfOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [doSave]);

  const runScan = useCallback(async () => {
    const key = getGeminiApiKey();
    if (!key || !content || !version) {
      toast.error("Add your Gemini API key in Settings.");
      return;
    }
    setScanOpen(true);
    setScanLoading(true);
    setIssues([]);
    setTips([]);
    try {
      const plain = tiptapToPlainText(content);
      const html = editorRef.current?.getHTML() ?? "";
      const { hasTable } = clientAtsSignals(html);

      const [g, a] = await Promise.all([
        generateJson<GrammarResponse>(key, GRAMMAR_SYSTEM, GRAMMAR_USER(plain)),
        generateJson<AtsResponse>(key, ATS_SYSTEM, ATS_USER(plain)),
      ]);

      const mappedIssues: GrammarIssue[] = (g.issues ?? []).map((i) => ({
        ...i,
        id: generateId(),
      }));
      setGrammarScore(
        typeof g.grammarScore === "number" ? g.grammarScore : null
      );
      setIssues(mappedIssues);

      let atsTips: AtsTip[] = (a.tips ?? []).map((t, idx) => ({
        id: generateId(),
        title: t.title,
        detail: t.detail,
        severity: t.severity ?? "info",
      }));
      if (hasTable) {
        atsTips = [
          {
            id: generateId(),
            title: "Tables detected",
            detail:
              "Tables often confuse ATS parsers. Prefer plain bullets and short lines.",
            severity: "warning",
          },
          ...atsTips,
        ];
      }
      setTips(atsTips);
      setAtsScore(typeof a.atsScore === "number" ? a.atsScore : null);

      await updateVersion(version.id, {
        grammarScore:
          typeof g.grammarScore === "number" ? g.grammarScore : null,
        atsScore: typeof a.atsScore === "number" ? a.atsScore : null,
      });
      setVersion((prev) =>
        prev
          ? {
              ...prev,
              grammarScore:
                typeof g.grammarScore === "number" ? g.grammarScore : null,
              atsScore: typeof a.atsScore === "number" ? a.atsScore : null,
            }
          : prev
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Scan failed");
    } finally {
      setScanLoading(false);
    }
  }, [content, version, updateVersion]);

  const runScanRef = useRef(runScan);
  runScanRef.current = runScan;

  useEffect(() => {
    const scan = () => void runScanRef.current();
    const tailor = () => setJobOpen(true);
    window.addEventListener("resumeforge:scan", scan);
    window.addEventListener("resumeforge:tailor", tailor);
    return () => {
      window.removeEventListener("resumeforge:scan", scan);
      window.removeEventListener("resumeforge:tailor", tailor);
    };
  }, []);

  const onApplyFix = (issue: GrammarIssue) => {
    if (!content || !issue.original) return;
    const next = replaceFirstTextInDoc(
      content,
      issue.original,
      issue.suggestion
    );
    setContent(next);
    editorRef.current?.commands.setContent(next, false);
    setPreviewContent(next);
    setIssues((prev) => prev.filter((i) => i.id !== issue.id));
    toast.success("Fix applied");
  };

  if (loading || !version || !content || !previewContent) {
    return (
      <AppShell>
        <div className="flex flex-1 items-center justify-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading resume…
        </div>
      </AppShell>
    );
  }

  const pdfName = inferDefaultPdfName(version, folder);
  const headerName = extractResumeName(content);

  return (
    <AppShell>
      <CommandPaletteHost />
      <div className="flex min-h-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="cursor-pointer gap-1"
          >
            <Link href="/" aria-label="Back to dashboard">
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Link>
          </Button>
          <div className="min-w-0 flex-1">
            {isEditingTitle ? (
              <Input
                autoFocus
                className="h-7 w-full max-w-sm px-2 text-sm font-semibold"
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                onBlur={handleRename}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRename();
                  if (e.key === "Escape") {
                    setTitleValue(version.title);
                    setIsEditingTitle(false);
                  }
                }}
              />
            ) : (
              <h1
                className="group flex cursor-pointer items-center gap-2 truncate text-sm font-semibold"
                onClick={() => setIsEditingTitle(true)}
              >
                {version.title}
                <Edit2 className="h-3 w-3 opacity-0 group-hover:opacity-100" />
              </h1>
            )}
            <p className="text-xs text-muted-foreground truncate">
              {folder?.name ?? "Folder"} · Auto-saves every 30s
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              {saving ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Check className="h-3 w-3 text-emerald-500" />
              )}
              {savedAt ? "Saved ✓" : "Saved ✓"}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="cursor-pointer border-border max-w-[140px] truncate sm:max-w-none"
                  aria-label="Resume layout template"
                >
                  Template:{" "}
                  {activeCustomTemplate
                    ? activeCustomTemplate.name
                    : RESUME_TEMPLATE_LABELS[template as ResumeTemplate] ||
                      "Custom"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="max-h-72 overflow-y-auto"
              >
                <div className="px-2 py-1.5 text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                  Built-in
                </div>
                {RESUME_TEMPLATE_IDS.map((t) => (
                  <div key={t} className="group flex items-center gap-1 pr-1">
                    <DropdownMenuItem
                      className="flex-1 cursor-pointer"
                      onSelect={() => {
                        setTemplate(t);
                        setVersion((prev) =>
                          prev ? { ...prev, template: t } : prev
                        );
                      }}
                    >
                      {RESUME_TEMPLATE_LABELS[t]}
                    </DropdownMenuItem>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 cursor-pointer opacity-0 group-hover:opacity-100 hover:bg-secondary focus:opacity-100"
                      title={`Customize ${RESUME_TEMPLATE_LABELS[t]}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        void onCustomizeBuiltIn(t);
                      }}
                    >
                      <Pencil className="h-3 w-3 text-muted-foreground" />
                    </Button>
                  </div>
                ))}

                {customTemplates.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <div className="px-2 py-1.5 text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                      Your Templates
                    </div>
                    {customTemplates.map((ct) => (
                      <DropdownMenuItem
                        key={ct.id}
                        className="cursor-pointer"
                        onSelect={() => {
                          setTemplate(ct.id);
                          setVersion((prev) =>
                            prev ? { ...prev, template: ct.id } : prev
                          );
                        }}
                      >
                        {ct.name}
                      </DropdownMenuItem>
                    ))}
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/templates" className="flex items-center gap-2">
                    <Layout className="h-3.5 w-3.5" />
                    Manage Templates
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="cursor-pointer border-border gap-1"
                  aria-label="Margin settings"
                >
                  <Settings2 className="h-4 w-4" />
                  Margins: {MARGIN_PRESET_LABELS[margins.preset]}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 p-4">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none text-sm">Margins</h4>
                    <p className="text-xs text-muted-foreground">
                      Set document margins for preview and PDF.
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <div className="grid grid-cols-2 gap-2">
                      {(
                        ["default", "minimum", "none", "custom"] as MarginPreset[]
                      ).map((p) => (
                        <Button
                          key={p}
                          size="sm"
                          variant={margins.preset === p ? "default" : "outline"}
                          className="cursor-pointer h-7 text-xs"
                          onClick={() =>
                            setMargins((prev) => ({ ...prev, preset: p }))
                          }
                        >
                          {MARGIN_PRESET_LABELS[p]}
                        </Button>
                      ))}
                    </div>
                    {margins.preset === "custom" && (
                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="grid gap-1">
                          <Label
                            htmlFor="margin-h"
                            className="text-[10px] uppercase"
                          >
                            Horizontal (px)
                          </Label>
                          <Input
                            id="margin-h"
                            type="number"
                            className="h-7 px-2 text-xs"
                            value={margins.horizontal}
                            onChange={(e) =>
                              setMargins((prev) => ({
                                ...prev,
                                horizontal: parseInt(e.target.value) || 0,
                              }))
                            }
                          />
                        </div>
                        <div className="grid gap-1">
                          <Label
                            htmlFor="margin-v"
                            className="text-[10px] uppercase"
                          >
                            Vertical (px)
                          </Label>
                          <Input
                            id="margin-v"
                            type="number"
                            className="h-7 px-2 text-xs"
                            value={margins.vertical}
                            onChange={(e) =>
                              setMargins((prev) => ({
                                ...prev,
                                vertical: parseInt(e.target.value) || 0,
                              }))
                            }
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="cursor-pointer border-border gap-1"
                  aria-label="Link settings"
                >
                  <LinkIcon className="h-4 w-4" />
                  Links
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-4">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none text-sm">
                      Link Style
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Customize how hyperlinks appear.
                    </p>
                  </div>
                  <div className="grid gap-3">
                    <div className="grid gap-1.5">
                      <Label htmlFor="link-color" className="text-xs">
                        Color
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="link-color-picker"
                          type="color"
                          className="h-8 w-12 p-1 cursor-pointer"
                          value={linkSettings.color}
                          onChange={(e) =>
                            setLinkSettings((prev) => ({
                              ...prev,
                              color: e.target.value,
                            }))
                          }
                        />
                        <Input
                          id="link-color-hex"
                          className="h-8 flex-1 px-2 text-xs font-mono"
                          value={linkSettings.color}
                          onChange={(e) =>
                            setLinkSettings((prev) => ({
                              ...prev,
                              color: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <Checkbox
                        id="link-underline"
                        checked={linkSettings.underline}
                        onCheckedChange={(checked) =>
                          setLinkSettings((prev) => ({
                            ...prev,
                            underline: !!checked,
                          }))
                        }
                      />
                      <Label
                        htmlFor="link-underline"
                        className="text-xs cursor-pointer font-normal"
                      >
                        Underline links
                      </Label>
                    </div>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="cursor-pointer gap-1"
              onClick={() => void doSave()}
            >
              Save
            </Button>
            <Button
              type="button"
              size="sm"
              className="cursor-pointer gap-1"
              onClick={() => setPdfOpen(true)}
              aria-label="Download PDF"
            >
              <FileDown className="h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </header>

        <div className="min-h-0 flex-1 p-3">
          <PanelGroup direction="horizontal" className="h-full min-h-[560px]">
            <Panel defaultSize={52} minSize={35}>
              <ResumeEditor
                content={content}
                onContentChange={(json) => {
                  setContent(json);
                }}
                onDebouncedPreview={(json) => setPreviewContent(json)}
                onScan={() => void runScan()}
                onTailor={() => setJobOpen(true)}
                onExportPdf={() => setPdfOpen(true)}
                disabledAi={!hasKey}
                onReady={(ed) => {
                  editorRef.current = ed;
                }}
              />
            </Panel>
            <PanelResizeHandle className="w-2 mx-1 rounded-full bg-border hover:bg-primary/40 transition-colors duration-200 cursor-col-resize" />
            <Panel defaultSize={48} minSize={30}>
              <div className="flex h-full min-h-0 flex-col rounded-lg border border-border bg-secondary/20">
                <div className="border-b border-border px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground">
                  Live preview
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto p-4 bg-zinc-100 text-neutral-900">
                  <ResumePreview
                    content={previewContent}
                    template={template}
                    customTemplate={activeCustomTemplate}
                    margins={margins}
                    linkSettings={linkSettings}
                  />
                </div>
              </div>
            </Panel>
          </PanelGroup>
        </div>
      </div>

      <ATSScorePanel
        open={scanOpen}
        onOpenChange={setScanOpen}
        loading={scanLoading}
        grammarScore={grammarScore}
        issues={issues}
        atsScore={atsScore}
        tips={tips}
        onApplyFix={onApplyFix}
      />

      <JobMatchModal
        open={jobOpen}
        onOpenChange={setJobOpen}
        version={version}
        apiKey={getGeminiApiKey() ?? ""}
        geminiModelId={getResolvedGeminiModel()}
      />

      <PDFExportModal
        open={pdfOpen}
        onOpenChange={setPdfOpen}
        content={previewContent}
        template={template}
        customTemplate={activeCustomTemplate}
        margins={margins}
        linkSettings={linkSettings}
        defaultFileName={pdfName}
        headerName={headerName}
      />
    </AppShell>
  );
}
