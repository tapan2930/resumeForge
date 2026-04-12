"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText } from "lucide-react";
import { useAppStore } from "@/stores/useAppStore";
import type { ResumeVersion } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

function atsBadgeVariant(score: number | null) {
  if (score == null) return "outline" as const;
  if (score < 60) return "danger" as const;
  if (score <= 80) return "warning" as const;
  return "success" as const;
}

export function RecentResumes() {
  const folders = useAppStore((s) => s.folders);
  const getRecent = useAppStore((s) => s.getRecentVersions);
  const [items, setItems] = useState<ResumeVersion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const list = await getRecent(6);
      if (!cancelled) {
        setItems(list);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [getRecent]);

  const folderName = (fid: string) =>
    folders.find((f) => f.id === fid)?.name ?? "Folder";

  if (loading) {
    return (
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <section className="mb-6" aria-labelledby="recent-heading">
      <h2
        id="recent-heading"
        className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground"
      >
        Recent resumes
      </h2>
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3" role="list">
        {items.map((v) => (
          <li key={v.id}>
            <Link href={`/resume/${v.id}`} className="block cursor-pointer">
              <Card className="transition-colors duration-200 hover:border-primary/40">
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm font-medium flex items-center justify-between gap-2 w-full">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="truncate">{v.title}</span>
                    </div>
                    {v.atsScore != null && (
                      <Badge variant={atsBadgeVariant(v.atsScore)} className="h-5 text-[10px] px-1.5 shrink-0">
                        ATS {v.atsScore}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3 pt-0 text-xs text-muted-foreground">
                  {folderName(v.folderId)} · {formatDate(v.updatedAt)}
                </CardContent>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
