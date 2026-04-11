"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  FolderOpen,
  Layout,
  MoreHorizontal,
  Pencil,
  Plus,
  Settings,
  Trash2,
} from "lucide-react";
import { useAppStore } from "@/stores/useAppStore";
import { FOLDER_COLORS, type ResumeFolder } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export function Sidebar() {
  const router = useRouter();
  const folders = useAppStore((s) => s.folders);
  const activeFolderId = useAppStore((s) => s.activeFolderId);
  const setActiveFolderId = useAppStore((s) => s.setActiveFolderId);
  const addFolder = useAppStore((s) => s.addFolder);
  const updateFolder = useAppStore((s) => s.updateFolder);
  const deleteFolder = useAppStore((s) => s.deleteFolder);
  const loadVersionsForFolder = useAppStore((s) => s.loadVersionsForFolder);

  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("Software Engineer");
  const [newColor, setNewColor] = useState<string>(FOLDER_COLORS[0]);

  const [renameTarget, setRenameTarget] = useState<ResumeFolder | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<ResumeFolder | null>(null);

  const openFolder = async (id: string) => {
    setActiveFolderId(id);
    await loadVersionsForFolder(id);
    router.push("/");
  };

  return (
    <aside
      className="flex h-full w-64 shrink-0 flex-col border-r border-border bg-card"
      aria-label="Role folders"
    >
      <div className="flex items-center justify-between border-b border-border px-3 py-3">
        <Link
          href="/"
          className="font-sans text-sm font-semibold uppercase tracking-widest text-foreground hover:text-primary transition-colors duration-200 cursor-pointer"
        >
          ResumeForge
        </Link>
        <div className="flex items-center gap-1">
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="h-8 w-8 cursor-pointer"
            aria-label="Templates"
          >
            <Link href="/templates">
              <Layout className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="h-8 w-8 cursor-pointer"
            aria-label="Settings"
          >
            <Link href="/settings">
              <Settings className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      <div className="px-3 py-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full cursor-pointer justify-start gap-2 border-border"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="h-4 w-4" />
          New role folder
        </Button>
      </div>

      <Separator />

      <ScrollArea className="flex-1 px-2 py-2">
        <nav aria-label="Folder tree">
          {folders.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">
              No roles yet. Create a folder to organize resume versions by target
              role.
            </p>
          ) : (
            <ul className="space-y-1" role="tree">
              {folders.map((f) => (
                <li key={f.id} role="treeitem" aria-expanded="true">
                  <Collapsible defaultOpen>
                    <div
                      className={cn(
                        "flex items-center gap-1 rounded-md px-1 py-0.5 transition-colors duration-200",
                        activeFolderId === f.id && "bg-secondary/80"
                      )}
                    >
                      <CollapsibleTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0 cursor-pointer data-[state=open]:[&_svg]:rotate-90"
                          aria-label={`Toggle ${f.name}`}
                        >
                          <ChevronRight className="h-4 w-4 transition-transform duration-200" />
                        </Button>
                      </CollapsibleTrigger>
                      <button
                        type="button"
                        className="flex min-w-0 flex-1 items-center gap-2 rounded-sm px-1 py-1 text-left text-sm cursor-pointer hover:bg-secondary/50 transition-colors duration-200"
                        onClick={() => void openFolder(f.id)}
                        aria-current={
                          activeFolderId === f.id ? "true" : undefined
                        }
                      >
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-white/20"
                          style={{ backgroundColor: f.color }}
                          aria-hidden
                        />
                        <FolderOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="truncate font-medium">{f.name}</span>
                      </button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0 cursor-pointer"
                            aria-label={`Folder actions for ${f.name}`}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => {
                              setRenameTarget(f);
                              setRenameValue(f.name);
                            }}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer text-destructive focus:text-destructive"
                            onClick={() => setDeleteTarget(f)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <CollapsibleContent>
                      <p className="pl-9 pr-2 pb-2 text-xs text-muted-foreground">
                        Versions for this role appear in the main panel when
                        selected.
                      </p>
                    </CollapsibleContent>
                  </Collapsible>
                </li>
              ))}
            </ul>
          )}
        </nav>
      </ScrollArea>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>New role folder</DialogTitle>
            <DialogDescription>
              Group resume versions by target role (e.g. Product Manager).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-2">
              <Label htmlFor="folder-name">Name</Label>
              <Input
                id="folder-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Role name"
              />
            </div>
            <div className="grid gap-2">
              <span className="text-sm font-medium">Color tag</span>
              <div className="flex flex-wrap gap-2">
                {FOLDER_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={cn(
                      "h-7 w-7 rounded-full ring-2 ring-offset-2 ring-offset-card cursor-pointer transition-transform duration-200 hover:scale-110",
                      newColor === c ? "ring-primary" : "ring-transparent"
                    )}
                    style={{ backgroundColor: c }}
                    aria-label={`Select color ${c}`}
                    onClick={() => setNewColor(c)}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              className="cursor-pointer"
              onClick={() => setCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="cursor-pointer"
              onClick={() => {
                const name = newName.trim() || "Untitled role";
                addFolder(name, newColor);
                setCreateOpen(false);
                setNewName("Software Engineer");
              }}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!renameTarget}
        onOpenChange={(o) => !o && setRenameTarget(null)}
      >
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Rename folder</DialogTitle>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            aria-label="Folder name"
          />
          <DialogFooter>
            <Button
              variant="secondary"
              className="cursor-pointer"
              onClick={() => setRenameTarget(null)}
            >
              Cancel
            </Button>
            <Button
              className="cursor-pointer"
              onClick={() => {
                if (renameTarget) {
                  updateFolder(renameTarget.id, {
                    name: renameValue.trim() || renameTarget.name,
                  });
                }
                setRenameTarget(null);
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Delete folder?</DialogTitle>
            <DialogDescription>
              This removes the folder and deletes all resume versions inside it
              from this device. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="secondary"
              className="cursor-pointer"
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="cursor-pointer"
              onClick={() => {
                if (deleteTarget) {
                  deleteFolder(deleteTarget.id);
                }
                setDeleteTarget(null);
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );
}
