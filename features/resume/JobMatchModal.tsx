"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { JSONContent } from "@tiptap/core";
import { toast } from "sonner";
import { Loader2, Sparkles, X, Link2 } from "lucide-react";
import { generateJson } from "@/features/ai/gemini";
import {
  RELEVANCE_SYSTEM,
  RELEVANCE_USER,
  TAILOR_SYSTEM,
  TAILOR_USER,
} from "@/lib/prompts";
import { useAppStore } from "@/stores/useAppStore";

import type { ResumeVersion } from "@/lib/types";
import {
  detectJobBoard,
  isValidJobUrl,
  supportedBoardsHint,
} from "@/lib/jobBoards";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

type Relevance = {
  overall_score: number;
  matched_keywords: string[];
  missing_keywords: string[];
  strengths: string[];
  gaps: string[];
};

type ParseApiSuccess = { success: true; data: Record<string, unknown> };
type ParseApiErr = {
  success: false;
  code?: string;
  error?: string;
  fallbackPlainText?: string;
};

function scoreColor(score: number) {
  if (score < 60) return "text-red-400";
  if (score <= 80) return "text-amber-400";
  return "text-emerald-400";
}

function Ring({ score }: { score: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, score));
  const offset = c - (pct / 100) * c;
  const stroke =
    score < 60 ? "#f87171" : score <= 80 ? "#fbbf24" : "#34d399";
  return (
    <svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      className="shrink-0"
      aria-hidden
    >
      <circle
        cx="60"
        cy="60"
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth="10"
        className="text-border"
      />
      <circle
        cx="60"
        cy="60"
        r={r}
        fill="none"
        stroke={stroke}
        strokeWidth="10"
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 60 60)"
      />
    </svg>
  );
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
}

function buildJdFromParsed(d: Record<string, unknown>): string {
  const desc =
    typeof d.jobDescription === "string" && d.jobDescription.trim()
      ? d.jobDescription.trim()
      : "";
  const parts: string[] = [];
  if (desc) parts.push(desc);
  const resp = asStringArray(d.responsibilities);
  if (resp.length) {
    parts.push(
      "Responsibilities:\n" + resp.map((x) => `- ${x}`).join("\n")
    );
  }
  const qual = asStringArray(d.qualifications);
  if (qual.length) {
    parts.push(
      "Qualifications:\n" + qual.map((x) => `- ${x}`).join("\n")
    );
  }
  const meta: string[] = [];
  if (typeof d.location === "string" && d.location.trim()) {
    meta.push(`Location: ${d.location.trim()}`);
  }
  if (typeof d.jobType === "string" && d.jobType.trim()) {
    meta.push(`Job type: ${d.jobType.trim()}`);
  }
  if (typeof d.experienceLevel === "string" && d.experienceLevel.trim()) {
    meta.push(`Experience: ${d.experienceLevel.trim()}`);
  }
  if (typeof d.salary === "string" && d.salary.trim()) {
    meta.push(`Salary: ${d.salary.trim()}`);
  }
  if (meta.length) parts.push(meta.join("\n"));
  return parts.join("\n\n");
}

function buildJobContext(
  jd: string,
  required: string[],
  nice: string[]
): string {
  const parts: string[] = [];
  if (jd.trim()) parts.push(jd.trim());
  if (required.length) {
    parts.push(
      "Required skills:\n" + required.map((s) => `- ${s}`).join("\n")
    );
  }
  if (nice.length) {
    parts.push(
      "Nice to have skills:\n" + nice.map((s) => `- ${s}`).join("\n")
    );
  }
  return parts.join("\n\n---\n\n");
}

function SkillPills({
  label,
  items,
  onRemove,
}: {
  label: string;
  items: string[];
  onRemove: (s: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div className="grid gap-2">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="flex flex-wrap gap-2" role="list">
        {items.map((s, i) => (
          <Badge
            key={`${s}-${i}`}
            variant="secondary"
            className="gap-1 pr-1 pl-2 py-1 font-normal"
            role="listitem"
          >
            <span className="max-w-[200px] truncate">{s}</span>
            <button
              type="button"
              className="rounded-sm p-0.5 hover:bg-muted cursor-pointer"
              aria-label={`Remove ${s}`}
              onClick={() => onRemove(s)}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  );
}

export function JobMatchModal({
  open,
  onOpenChange,
  version,
  apiKey,
  geminiModelId,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  version: ResumeVersion | null;
  apiKey: string;
  geminiModelId?: string;
}) {
  const router = useRouter();
  const jdRef = useRef<HTMLTextAreaElement>(null);

  const [jobUrl, setJobUrl] = useState("");
  const [urlError, setUrlError] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jd, setJd] = useState("");
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [niceSkills, setNiceSkills] = useState<string[]>([]);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [loading, setLoading] = useState<"score" | "tailor" | null>(null);
  const [relevance, setRelevance] = useState<Relevance | null>(null);

  const board = jobUrl.trim() ? detectJobBoard(jobUrl.trim()) : null;

  const fullReset = () => {
    setRelevance(null);
    setLoading(null);
    setFetchLoading(false);
    setJobUrl("");
    setUrlError("");
    setJobTitle("");
    setCompanyName("");
    setJd("");
    setRequiredSkills([]);
    setNiceSkills([]);
  };

  const jobContext = () => buildJobContext(jd, requiredSkills, niceSkills);

  const fetchJobFromUrl = async () => {
    setUrlError("");
    const u = jobUrl.trim();
    if (!u) {
      setUrlError("Enter a job posting URL.");
      return;
    }
    if (!isValidJobUrl(u)) {
      setUrlError(
        `Supported boards: ${supportedBoardsHint()}. Use a full job posting URL.`
      );
      return;
    }
    if (!apiKey) {
      toast.error("Add your Gemini API key in Settings.");
      return;
    }

    setFetchLoading(true);
    try {
      const res = await fetch("/api/parse-job-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: u,
          geminiApiKey: apiKey,
          modelId: geminiModelId,
        }),
      });

      const json = (await res.json()) as ParseApiSuccess | ParseApiErr;

      if (!res.ok || !json.success) {
        const err = json as ParseApiErr;
        const msg =
          err.error ||
          "Could not fetch job details. Try pasting the description manually.";
        if (err.code === "LINKEDIN_BLOCKED") {
          toast.error(msg);
          jdRef.current?.focus();
        } else if (err.code === "LOGIN_REQUIRED") {
          toast.error(msg);
          if (err.fallbackPlainText) {
            setJd(err.fallbackPlainText);
            toast.message("Loaded partial page text into the description field.");
          }
        } else if (err.fallbackPlainText) {
          setJd(err.fallbackPlainText);
          toast.error(msg);
        } else {
          toast.error(msg);
        }
        return;
      }

      const d = json.data;
      if (typeof d.jobTitle === "string" && d.jobTitle.trim()) {
        setJobTitle(d.jobTitle.trim());
      }
      if (typeof d.companyName === "string" && d.companyName.trim()) {
        setCompanyName(d.companyName.trim());
      }
      setRequiredSkills(asStringArray(d.requiredSkills));
      setNiceSkills(asStringArray(d.niceToHaveSkills));
      const built = buildJdFromParsed(d);
      if (built.trim()) {
        setJd(built);
      }
      toast.success("Job details fetched!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Request failed");
    } finally {
      setFetchLoading(false);
    }
  };

  const analyze = async () => {
    if (!version) return;
    const ctx = jobContext();
    if (!jobTitle.trim() || !ctx.trim()) {
      toast.error("Job title and job description (or fetched content) are required.");
      return;
    }
    setLoading("score");
    try {
      const { tiptapToPlainText } = await import("@/lib/tiptap-helpers");
      const plain = tiptapToPlainText(version.content);
      const data = await generateJson<Relevance>(
        apiKey,
        RELEVANCE_SYSTEM,
        RELEVANCE_USER(plain, jobTitle, companyName, ctx),
        geminiModelId
      );
      setRelevance(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setLoading(null);
    }
  };

  const tailor = async () => {
    if (!version || !relevance) return;
    const ctx = jobContext();
    setLoading("tailor");
    try {
      const jsonStr = JSON.stringify(version.content);
      const data = await generateJson<{ title: string; content: JSONContent }>(
        apiKey,
        TAILOR_SYSTEM,
        TAILOR_USER(
          jsonStr,
          jobTitle,
          companyName,
          ctx,
          relevance.matched_keywords ?? [],
          relevance.missing_keywords ?? []
        ),
        geminiModelId
      );
      if (!data?.content || data.content.type !== "doc") {
        throw new Error("Invalid tailored document from model");
      }
      const title = data.title?.trim() || `AI Tailored — ${jobTitle}`;
      const nv = await useAppStore.getState().addVersion(version.folderId, {
        title,
        content: data.content,
        template: version.template,
        isTailored: true,
      });

      toast.success("Tailored version created");
      onOpenChange(false);
      fullReset();
      router.push(`/resume/${nv.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Tailoring failed");
    } finally {
      setLoading(null);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) fullReset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Tailor for job</DialogTitle>
          <DialogDescription>
            Fetch a posting URL or paste a description, then score fit and
            generate a tailored version. Your original resume is never
            overwritten.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-2">
          <div className="grid gap-2">
            <Label htmlFor="jm-url">Paste job URL (LinkedIn, Indeed, …)</Label>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
              <Input
                id="jm-url"
                type="url"
                value={jobUrl}
                onChange={(e) => {
                  setJobUrl(e.target.value);
                  setUrlError("");
                }}
                placeholder="https://…"
                className="sm:flex-1"
                aria-invalid={!!urlError}
                aria-describedby={urlError ? "jm-url-err" : undefined}
              />
              <Button
                type="button"
                variant="secondary"
                className="cursor-pointer gap-2 shrink-0"
                disabled={fetchLoading || loading !== null}
                onClick={() => void fetchJobFromUrl()}
                aria-busy={fetchLoading}
              >
                {fetchLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Link2 className="h-4 w-4" />
                )}
                Fetch job details
              </Button>
            </div>
            {board && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground flex items-center gap-1">
                  <span aria-hidden>Detected:</span>
                  <Badge
                    className="border-0 font-medium text-white"
                    style={{ backgroundColor: board.color }}
                  >
                    {board.name}
                  </Badge>
                </span>
              </div>
            )}
            {urlError && (
              <p id="jm-url-err" className="text-xs text-destructive" role="alert">
                {urlError}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="jm-title">Job title</Label>
            <Input
              id="jm-title"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g. Staff Software Engineer"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="jm-co">Company name</Label>
            <Input
              id="jm-co"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Optional"
            />
          </div>

          <SkillPills
            label="Required skills (from fetch — click × to remove)"
            items={requiredSkills}
            onRemove={(s) =>
              setRequiredSkills((prev) => prev.filter((x) => x !== s))
            }
          />
          <SkillPills
            label="Nice to have skills"
            items={niceSkills}
            onRemove={(s) => setNiceSkills((prev) => prev.filter((x) => x !== s))}
          />

          <div className="grid gap-2">
            <Label htmlFor="jm-jd">Job description</Label>
            <div className="relative rounded-md">
              {fetchLoading && (
                <div
                  className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-md bg-background/85 text-sm text-muted-foreground border border-border"
                  role="status"
                  aria-live="polite"
                >
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  Fetching job details…
                </div>
              )}
              <Textarea
                ref={jdRef}
                id="jm-jd"
                value={jd}
                onChange={(e) => setJd(e.target.value)}
                rows={6}
                placeholder="Paste the job description or use Fetch above…"
                disabled={fetchLoading}
                className="min-h-[140px]"
              />
            </div>
          </div>
          <Button
            type="button"
            className="cursor-pointer w-full sm:w-auto"
            onClick={() => void analyze()}
            disabled={loading !== null || fetchLoading}
          >
            {loading === "score" && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Analyze &amp; score
          </Button>
        </div>

        {relevance && (
          <div className="space-y-4 border-t border-border pt-4">
            <div className="flex items-center gap-6">
              <Ring score={relevance.overall_score} />
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Relevance
                </p>
                <p
                  className={`text-4xl font-semibold tabular-nums ${scoreColor(relevance.overall_score)}`}
                >
                  {Math.round(relevance.overall_score)}
                  <span className="text-lg text-muted-foreground font-normal">
                    /100
                  </span>
                </p>
              </div>
            </div>

            <Tabs defaultValue="matched">
              <TabsList className="flex flex-wrap h-auto gap-1">
                <TabsTrigger value="matched" className="cursor-pointer text-xs">
                  Matched
                </TabsTrigger>
                <TabsTrigger value="missing" className="cursor-pointer text-xs">
                  Missing
                </TabsTrigger>
                <TabsTrigger value="strengths" className="cursor-pointer text-xs">
                  Strengths
                </TabsTrigger>
                <TabsTrigger value="gaps" className="cursor-pointer text-xs">
                  Gaps
                </TabsTrigger>
              </TabsList>
              <TabsContent value="matched">
                <ScrollArea className="h-28">
                  <div className="flex flex-wrap gap-2">
                    {(relevance.matched_keywords ?? []).map((k) => (
                      <Badge key={k} variant="success">
                        {k}
                      </Badge>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
              <TabsContent value="missing">
                <ScrollArea className="h-28">
                  <div className="flex flex-wrap gap-2">
                    {(relevance.missing_keywords ?? []).map((k) => (
                      <Badge key={k} variant="warning">
                        {k}
                      </Badge>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
              <TabsContent value="strengths">
                <ul className="list-disc pl-5 text-sm space-y-1">
                  {(relevance.strengths ?? []).map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </TabsContent>
              <TabsContent value="gaps">
                <ul className="list-disc pl-5 text-sm space-y-1">
                  {(relevance.gaps ?? []).map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </TabsContent>
            </Tabs>

            <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
              <Button
                type="button"
                variant="secondary"
                className="cursor-pointer"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
              <Button
                type="button"
                className="cursor-pointer gap-2"
                onClick={() => void tailor()}
                disabled={loading !== null || fetchLoading}
              >
                {loading === "tailor" && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                <Sparkles className="h-4 w-4" />
                Generate tailored version
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
