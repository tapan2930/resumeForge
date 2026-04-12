"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, FileText, Plus, Trash2, Edit2, Check, X, FolderUp } from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/stores/useAppStore";
import type { ResumeVersion } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function atsBadgeVariant(score: number | null) {
  if (score == null) return "outline" as const;
  if (score < 60) return "danger" as const;
  if (score <= 80) return "warning" as const;
  return "success" as const;
}

export function VersionList() {
  const router = useRouter();
  const activeFolderId = useAppStore((s) => s.activeFolderId);
  const folders = useAppStore((s) => s.folders);
  const versionsCache = useAppStore((s) => s.versionsCache);
  const loadVersionsForFolder = useAppStore((s) => s.loadVersionsForFolder);
  const addVersion = useAppStore((s) => s.addVersion);
  const updateVersion = useAppStore((s) => s.updateVersion);
  const duplicateVersion = useAppStore((s) => s.duplicateVersion);
  const moveVersion = useAppStore((s) => s.moveVersion);
  const removeVersion = useAppStore((s) => s.removeVersion);
  const undoDeleteVersion = useAppStore((s) => s.undoDeleteVersion);

  const [loading, setLoading] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renamingValue, setRenamingValue] = useState("");

  const activeFolder = folders.find((f) => f.id === activeFolderId);
  const versions = activeFolderId
    ? versionsCache[activeFolderId] ?? []
    : [];

  useEffect(() => {
    if (!activeFolderId) return;
    setLoading(true);
    void loadVersionsForFolder(activeFolderId).finally(() => setLoading(false));
  }, [activeFolderId, loadVersionsForFolder]);

  const onRename = async (v: ResumeVersion) => {
    if (!renamingValue.trim() || renamingValue === v.title) {
      setRenamingId(null);
      return;
    }
    try {
      await updateVersion(v.id, { title: renamingValue.trim() });
      setRenamingId(null);
      toast.success("Version renamed");
    } catch (e) {
      toast.error("Rename failed");
    }
  };

  const onDelete = async (v: ResumeVersion) => {
    await removeVersion(v.id, v.folderId);
    toast("Version deleted", {
      action: {
        label: "Undo",
        onClick: () => void undoDeleteVersion(),
      },
      duration: 10000,
    });
  };

  if (!activeFolderId || !activeFolder) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-center text-muted-foreground text-sm">
        Select a role folder from the sidebar to view versions.
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-6 overflow-auto">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            {activeFolder.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            Resume versions for this role. Open one to edit with live preview.
          </p>
        </div>
        <Button
          type="button"
          className="cursor-pointer gap-2"
          onClick={async () => {
            const v = await addVersion(activeFolderId);
            router.push(`/resume/${v.id}`);
          }}
        >
          <Plus className="h-4 w-4" />
          New version
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-36 rounded-lg" />
          ))}
        </div>
      ) : versions.length === 0 ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-base">No versions yet</CardTitle>
            <CardDescription>
              Create a version to start editing. Each version keeps its own
              content, template, and scores.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              type="button"
              variant="secondary"
              className="cursor-pointer gap-2"
              onClick={async () => {
                const v = await addVersion(activeFolderId);
                router.push(`/resume/${v.id}`);
              }}
            >
              <Plus className="h-4 w-4" />
              Create first version
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" role="list">
          {versions.map((v) => (
            <li key={v.id}>
              <Card className="h-full transition-shadow duration-200 hover:shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base font-semibold leading-snug w-full">
                      {renamingId === v.id ? (
                        <div className="flex items-center gap-1 w-full">
                          <Input
                            autoFocus
                            size={1}
                            className="h-8 flex-1"
                            value={renamingValue}
                            onChange={(e) => setRenamingValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") void onRename(v);
                              if (e.key === "Escape") setRenamingId(null);
                            }}
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-emerald-500"
                            onClick={() => void onRename(v)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground"
                            onClick={() => setRenamingId(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Link
                          href={`/resume/${v.id}`}
                          className="cursor-pointer hover:text-primary transition-colors duration-200 inline-flex items-start gap-2 w-full"
                        >
                          <FileText className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
                          <span className="line-clamp-2">{v.title}</span>
                        </Link>
                      )}
                    </CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    Updated {formatDate(v.updatedAt)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 pt-0">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={atsBadgeVariant(v.atsScore)}>
                      ATS {v.atsScore != null ? `${v.atsScore}` : "—"}
                    </Badge>
                    {v.grammarScore != null && (
                      <Badge variant="secondary">
                        Grammar {v.grammarScore}
                      </Badge>
                    )}
                    {v.isTailored && (
                      <Badge variant="outline" className="border-amber-500/50 text-amber-400">
                        AI tailored
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      asChild
                      size="sm"
                      variant="secondary"
                      className="cursor-pointer"
                    >
                      <Link href={`/resume/${v.id}`}>Open</Link>
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="cursor-pointer gap-1"
                      onClick={() => {
                        setRenamingId(v.id);
                        setRenamingValue(v.title);
                      }}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      Rename
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="cursor-pointer gap-1"
                      aria-label={`Duplicate ${v.title}`}
                      onClick={async () => {
                        const copy = await duplicateVersion(v.id);
                        if (copy) {
                          toast.success("Version duplicated");
                          router.push(`/resume/${copy.id}`);
                        }
                      }}
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Duplicate
                    </Button>
                    {folders.length > 1 && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="cursor-pointer gap-1"
                          >
                            <FolderUp className="h-3.5 w-3.5" />
                            Move
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {folders
                            .filter((f) => f.id !== v.folderId)
                            .map((f) => (
                              <DropdownMenuItem
                                key={f.id}
                                className="cursor-pointer"
                                onClick={async () => {
                                  try {
                                    await moveVersion(v.id, v.folderId, f.id);
                                    toast.success(`Moved to ${f.name}`);
                                  } catch (e) {
                                    toast.error("Failed to move version");
                                  }
                                }}
                              >
                                {f.name}
                              </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="cursor-pointer text-destructive hover:text-destructive"
                      aria-label={`Delete ${v.title}`}
                      onClick={() => void onDelete(v)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
