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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { generateJson } from "@/features/ai/gemini";
import {
  ATS_SYSTEM,
  ATS_USER,
  GRAMMAR_SYSTEM,
  GRAMMAR_USER,
} from "@/lib/prompts";
import { getGeminiApiKey } from "@/lib/storage";
import {
  clientAtsSignals,
  replaceFirstTextInDoc,
  tiptapToPlainText,
} from "@/lib/tiptap-helpers";
import { extractResumeName } from "@/lib/extract-name";
import { generateId } from "@/lib/utils";
import type {
  ResumeFontPreset,
  ResumeTemplate,
  ResumeVersion,
} from "@/lib/types";
import {
  DEFAULT_RESUME_FONT_PRESET,
  RESUME_FONT_PRESETS,
  RESUME_FONT_PRESET_ORDER,
} from "@/lib/resume-fonts";
import {
  RESUME_TEMPLATE_IDS,
  RESUME_TEMPLATE_LABELS,
} from "@/lib/resume-template-styles";
import { useGemini } from "@/features/ai/useGemini";

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
  const getVersionById = useAppStore((s) => s.getVersionById);
  const updateVersion = useAppStore((s) => s.updateVersion);

  const [version, setVersion] = useState<ResumeVersion | null>(null);
  const [content, setContent] = useState<JSONContent | null>(null);
  const [previewContent, setPreviewContent] = useState<JSONContent | null>(
    null
  );
  const [template, setTemplate] = useState<ResumeTemplate>("minimal");
  const [fontPreset, setFontPreset] = useState<ResumeFontPreset>(
    DEFAULT_RESUME_FONT_PRESET
  );
  const [loading, setLoading] = useState(true);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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

  const folder = useMemo(
    () => folders.find((f) => f.id === version?.folderId),
    [folders, version?.folderId]
  );

  const persist = useCallback(
    async (
      v: ResumeVersion,
      json: JSONContent,
      tmpl: ResumeTemplate,
      fp: ResumeFontPreset
    ) => {
      if (!v) return;
      setSaving(true);
      try {
        await updateVersion(v.id, {
          content: json,
          template: tmpl,
          fontPreset: fp,
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
    let cancelled = false;
    void (async () => {
      if (!id) return;
      const v = await getVersionById(id);
      if (cancelled) return;
      if (!v) {
        toast.error("Resume not found");
        router.push("/");
        return;
      }
      setVersion(v);
      setContent(v.content);
      setPreviewContent(v.content);
      setTemplate(v.template);
      setFontPreset(v.fontPreset ?? DEFAULT_RESUME_FONT_PRESET);
      setGrammarScore(v.grammarScore);
      setAtsScore(v.atsScore);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id, getVersionById, router]);

  const doSave = useCallback(async () => {
    if (!version || !content) return;
    await persist(version, content, template, fontPreset);
  }, [version, content, template, fontPreset, persist]);

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
            <h1 className="truncate text-sm font-semibold">{version.title}</h1>
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
                  Template: {RESUME_TEMPLATE_LABELS[template]}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="max-h-72 overflow-y-auto">
                {RESUME_TEMPLATE_IDS.map((t) => (
                  <DropdownMenuItem
                    key={t}
                    className="cursor-pointer"
                    onClick={() => setTemplate(t)}
                  >
                    {RESUME_TEMPLATE_LABELS[t]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="cursor-pointer border-border max-w-[160px] truncate sm:max-w-[200px]"
                  aria-label="Resume fonts"
                >
                  Font: {RESUME_FONT_PRESETS[fontPreset].label}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="max-h-72 overflow-y-auto w-64">
                {RESUME_FONT_PRESET_ORDER.map((fid) => (
                  <DropdownMenuItem
                    key={fid}
                    className="cursor-pointer"
                    onClick={() => setFontPreset(fid)}
                  >
                    {RESUME_FONT_PRESETS[fid].label}
                  </DropdownMenuItem>
                ))}
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
                <div className="min-h-0 flex-1 overflow-y-auto p-4 bg-[#141414]">
                  <ResumePreview
                    content={previewContent}
                    template={template}
                    fontPreset={fontPreset}
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
      />

      <PDFExportModal
        open={pdfOpen}
        onOpenChange={setPdfOpen}
        content={previewContent}
        template={template}
        fontPreset={fontPreset}
        defaultFileName={pdfName}
        headerName={headerName}
      />
    </AppShell>
  );
}
