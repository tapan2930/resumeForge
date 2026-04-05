"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { JSONContent } from "@tiptap/core";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";
import { generateJson } from "@/features/ai/gemini";
import {
  RELEVANCE_SYSTEM,
  RELEVANCE_USER,
  TAILOR_SYSTEM,
  TAILOR_USER,
} from "@/lib/prompts";
import { useAppStore } from "@/stores/useAppStore";
import { generateId } from "@/lib/utils";
import type { ResumeVersion } from "@/lib/types";
import { DEFAULT_RESUME_FONT_PRESET } from "@/lib/resume-fonts";
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

export function JobMatchModal({
  open,
  onOpenChange,
  version,
  apiKey,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  version: ResumeVersion | null;
  apiKey: string;
}) {
  const router = useRouter();

  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState<"score" | "tailor" | null>(null);
  const [relevance, setRelevance] = useState<Relevance | null>(null);

  const reset = () => {
    setRelevance(null);
    setLoading(null);
  };

  const analyze = async () => {
    if (!version) return;
    if (!jobTitle.trim() || !jd.trim()) {
      toast.error("Job title and job description are required.");
      return;
    }
    setLoading("score");
    try {
      const { tiptapToPlainText } = await import("@/lib/tiptap-helpers");
      const plain = tiptapToPlainText(version.content);
      const data = await generateJson<Relevance>(
        apiKey,
        RELEVANCE_SYSTEM,
        RELEVANCE_USER(plain, jobTitle, companyName, jd)
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
          jd,
          relevance.matched_keywords ?? [],
          relevance.missing_keywords ?? []
        )
      );
      if (!data?.content || data.content.type !== "doc") {
        throw new Error("Invalid tailored document from model");
      }
      const t = new Date().toISOString();
      const nv: ResumeVersion = {
        id: generateId(),
        folderId: version.folderId,
        title: data.title?.trim() || `AI Tailored — ${jobTitle}`,
        content: data.content,
        template: version.template,
        fontPreset: version.fontPreset ?? DEFAULT_RESUME_FONT_PRESET,
        atsScore: null,
        grammarScore: null,
        isTailored: true,
        jobTitle: jobTitle.trim(),
        companyName: companyName.trim(),
        relevanceScore: relevance.overall_score,
        tags: ["ai-tailored"],
        createdAt: t,
        updatedAt: t,
      };
      const { putVersion } = await import("@/lib/idb");
      await putVersion(nv);
      await useAppStore.getState().loadVersionsForFolder(version.folderId);
      toast.success("Tailored version created");
      onOpenChange(false);
      reset();
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
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Tailor for job</DialogTitle>
          <DialogDescription>
            Score fit against a job description, then generate a new tailored
            version. Your original version is never overwritten.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-2">
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
          <div className="grid gap-2">
            <Label htmlFor="jm-jd">Job description</Label>
            <Textarea
              id="jm-jd"
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              rows={6}
              placeholder="Paste the job description…"
            />
          </div>
          <Button
            type="button"
            className="cursor-pointer w-full sm:w-auto"
            onClick={() => void analyze()}
            disabled={loading !== null}
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
                disabled={loading !== null}
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
