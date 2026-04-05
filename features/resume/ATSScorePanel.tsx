"use client";

import { useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export type GrammarIssue = {
  id: string;
  section: string;
  original: string;
  suggestion: string;
  severity: "error" | "warning" | "suggestion";
};

export type AtsTip = {
  id: string;
  title: string;
  detail: string;
  severity: "error" | "warning" | "info";
};

function atsBadgeClass(score: number | null) {
  if (score == null) return "outline";
  if (score < 60) return "danger";
  if (score <= 80) return "warning";
  return "success";
}

export function ATSScorePanel({
  open,
  onOpenChange,
  loading,
  grammarScore,
  issues,
  atsScore,
  tips,
  onApplyFix,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  loading: boolean;
  grammarScore: number | null;
  issues: GrammarIssue[];
  atsScore: number | null;
  tips: AtsTip[];
  onApplyFix: (issue: GrammarIssue) => void;
}) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const visibleIssues = useMemo(
    () => issues.filter((i) => !dismissed.has(i.id)),
    [issues, dismissed]
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col sm:max-w-lg border-l border-border"
        aria-describedby="scan-panel-desc"
      >
        <SheetHeader>
          <SheetTitle>Resume scan</SheetTitle>
          <SheetDescription id="scan-panel-desc">
            Grammar, style, and ATS-oriented suggestions. Apply fixes directly
            into your editor.
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="mt-4 space-y-3" aria-busy="true">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : (
          <div className="mt-2 flex min-h-0 flex-1 flex-col gap-4">
            <div className="flex flex-wrap gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  Grammar score
                </span>
                <Badge
                  variant="secondary"
                  className="w-fit text-sm px-3 py-1"
                >
                  {grammarScore != null ? `${grammarScore}/100` : "—"}
                </Badge>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  ATS score
                </span>
                <Badge
                  variant={atsBadgeClass(atsScore)}
                  className="w-fit text-sm px-3 py-1"
                >
                  {atsScore != null ? `${atsScore}/100` : "—"}
                </Badge>
              </div>
            </div>

            <Tabs defaultValue="grammar" className="flex min-h-0 flex-1 flex-col">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="grammar" className="cursor-pointer">
                  Issues ({visibleIssues.length})
                </TabsTrigger>
                <TabsTrigger value="ats" className="cursor-pointer">
                  ATS tips ({tips.length})
                </TabsTrigger>
              </TabsList>
              <TabsContent
                value="grammar"
                className="mt-2 min-h-0 flex-1 data-[state=inactive]:hidden"
              >
                <ScrollArea className="h-[calc(100vh-280px)] pr-3">
                  <ul className="space-y-3" role="list">
                    {visibleIssues.length === 0 ? (
                      <li className="text-sm text-muted-foreground">
                        No grammar issues listed. Run a scan after editing more
                        content.
                      </li>
                    ) : (
                      visibleIssues.map((issue) => (
                        <li
                          key={issue.id}
                          className="rounded-lg border border-border bg-background/50 p-3"
                        >
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                            <span className="font-medium text-foreground/90">
                              {issue.section}
                            </span>
                            <Badge variant="outline" className="text-[10px]">
                              {issue.severity}
                            </Badge>
                          </div>
                          <p className="text-xs line-through text-muted-foreground mb-1">
                            {issue.original}
                          </p>
                          <p className="text-sm mb-2">{issue.suggestion}</p>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              size="sm"
                              className="cursor-pointer"
                              onClick={() => onApplyFix(issue)}
                              disabled={!issue.original}
                            >
                              Apply fix
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="cursor-pointer"
                              onClick={() =>
                                setDismissed((s) => new Set(s).add(issue.id))
                              }
                            >
                              Dismiss
                            </Button>
                          </div>
                        </li>
                      ))
                    )}
                  </ul>
                </ScrollArea>
              </TabsContent>
              <TabsContent
                value="ats"
                className="mt-2 min-h-0 flex-1 data-[state=inactive]:hidden"
              >
                <ScrollArea className="h-[calc(100vh-280px)] pr-3">
                  <ul className="space-y-3" role="list">
                    {tips.length === 0 ? (
                      <li className="text-sm text-muted-foreground">
                        No ATS tips returned.
                      </li>
                    ) : (
                      tips.map((tip) => (
                        <li
                          key={tip.id}
                          className="flex gap-2 rounded-lg border border-border bg-background/50 p-3"
                        >
                          {tip.severity === "error" ? (
                            <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
                          ) : tip.severity === "warning" ? (
                            <AlertCircle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                          ) : (
                            <Info className="h-4 w-4 shrink-0 text-sky-400 mt-0.5" />
                          )}
                          <div>
                            <p className="text-sm font-medium">{tip.title}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {tip.detail}
                            </p>
                          </div>
                        </li>
                      ))
                    )}
                  </ul>
                </ScrollArea>
              </TabsContent>
            </Tabs>

            <Separator />
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              Scores are guidance only. Always verify facts before applying AI
              suggestions.
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
