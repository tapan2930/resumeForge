"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  FolderOpen,
  Layout,
  LogOut,
  MoreHorizontal,
  Pencil,
  Plus,
  Settings,
  Trash2,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useKindeBrowserClient, LogoutLink } from "@kinde-oss/kinde-auth-nextjs";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function Sidebar() {
  const router = useRouter();
  const { user } = useKindeBrowserClient();
  const folders = useAppStore((s) => s.folders);
  const activeFolderId = useAppStore((s) => s.activeFolderId);
  const setActiveFolderId = useAppStore((s) => s.setActiveFolderId);
  const addFolder = useAppStore((s) => s.addFolder);
  const updateFolder = useAppStore((s) => s.updateFolder);
  const deleteFolder = useAppStore((s) => s.deleteFolder);
  const loadVersionsForFolder = useAppStore((s) => s.loadVersionsForFolder);
  const isSidebarCollapsed = useAppStore((s) => s.isSidebarCollapsed);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);

  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("Software Engineer");
  const [newColor, setNewColor] = useState<string>(FOLDER_COLORS[0]);

  const [renameTarget, setRenameTarget] = useState<ResumeFolder | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renameColor, setRenameColor] = useState<string>("");

  const [deleteTarget, setDeleteTarget] = useState<ResumeFolder | null>(null);

  const openFolder = async (id: string) => {
    setActiveFolderId(id);
    await loadVersionsForFolder(id);
    router.push("/dashboard");
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "flex h-full shrink-0 flex-col border-r border-border bg-card transition-[width] duration-300 ease-in-out",
          isSidebarCollapsed ? "w-[68px]" : "w-64"
        )}
        aria-label="Role folders"
      >
        <div className={cn("flex border-b border-border py-4", isSidebarCollapsed ? "flex-col items-center gap-4 px-2" : "items-center justify-between px-4")}>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 cursor-pointer shrink-0"
              onClick={toggleSidebar}
              aria-label="Toggle Sidebar"
            >
              {isSidebarCollapsed ? (
                <PanelLeftOpen className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              ) : (
                <PanelLeftClose className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              )}
            </Button>
            {!isSidebarCollapsed && (
              <Link
                href="/dashboard"
                className="font-sans text-sm font-semibold uppercase tracking-widest text-foreground hover:text-primary transition-colors duration-200 cursor-pointer"
              >
                ResumeForge
              </Link>
            )}
          </div>
          <div className={cn("flex items-center gap-1", isSidebarCollapsed ? "flex-col" : "flex-row")}>
            <Tooltip>
              <TooltipTrigger asChild>
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
              </TooltipTrigger>
              {isSidebarCollapsed && <TooltipContent side="right">Templates</TooltipContent>}
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
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
              </TooltipTrigger>
              {isSidebarCollapsed && <TooltipContent side="right">Settings</TooltipContent>}
            </Tooltip>
          </div>
        </div>

        <div className="px-3 py-3 flex justify-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant={isSidebarCollapsed ? "ghost" : "outline"}
                size={isSidebarCollapsed ? "icon" : "sm"}
                className={cn(
                  "cursor-pointer border-border",
                  isSidebarCollapsed ? "h-8 w-8" : "w-full justify-start gap-2"
                )}
                onClick={() => setCreateOpen(true)}
              >
                <Plus className="h-4 w-4" />
                {!isSidebarCollapsed && "New role folder"}
              </Button>
            </TooltipTrigger>
            {isSidebarCollapsed && <TooltipContent side="right">New role folder</TooltipContent>}
          </Tooltip>
        </div>

        <Separator />

        <ScrollArea className="flex-1 px-2 py-2">
          <nav aria-label="Folder tree">
            {folders.length === 0 ? (
              !isSidebarCollapsed && (
                <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                  No roles yet. Create a folder to organize resume versions by target
                  role.
                </p>
              )
            ) : (
              <ul className="space-y-1" role="tree">
                {folders.map((f) => (
                  <li key={f.id} role="treeitem" aria-expanded="true">
                    <div>
                      <div
                        className={cn(
                          "flex overflow-hidden min-w-0 w-full items-center gap-1 rounded-md px-1 py-0.5 transition-colors duration-200",
                          activeFolderId === f.id && "bg-secondary/80",
                          isSidebarCollapsed && "justify-center"
                        )}
                      >
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              className={cn(
                                "flex min-w-0 items-center rounded-sm text-left text-sm cursor-pointer hover:bg-secondary/50 transition-colors duration-200",
                                isSidebarCollapsed ? "justify-center p-2 w-full" : "flex-1 gap-2 px-1 py-1"
                              )}
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
                              {!isSidebarCollapsed && <FolderOpen className="h-4 w-4 shrink-0 text-muted-foreground" />}
                              {!isSidebarCollapsed && <span className="truncate flex-1 min-w-0 font-medium">{f.name}</span>}
                            </button>
                          </TooltipTrigger>
                          {isSidebarCollapsed && <TooltipContent side="right">{f.name}</TooltipContent>}
                        </Tooltip>
                        {!isSidebarCollapsed && (
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
                                  setRenameColor(f.color);
                                }}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
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
                        )}
                      </div>

                    </div>
                  </li>
                ))}
              </ul>
            )}
          </nav>
        </ScrollArea>

        <div className="border-t border-border p-3">
          <div className={cn("flex items-center gap-2", isSidebarCollapsed ? "flex-col justify-center" : "justify-between")}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex min-w-0 items-center gap-2 cursor-pointer">
                  {user?.picture ? (
                    <img
                      src={user.picture}
                      alt=""
                      className="h-7 w-7 shrink-0 rounded-full bg-secondary"
                    />
                  ) : (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-[10px] font-bold uppercase">
                      {user?.given_name?.[0] || "U"}
                    </div>
                  )}
                  {!isSidebarCollapsed && (
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold">
                        {user?.given_name} {user?.family_name}
                      </p>
                      <p className="truncate text-[10px] text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  )}
                </div>
              </TooltipTrigger>
              {isSidebarCollapsed && <TooltipContent side="right">{user?.email}</TooltipContent>}
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <LogoutLink>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 cursor-pointer text-muted-foreground hover:text-foreground"
                    aria-label="Logout"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </LogoutLink>
              </TooltipTrigger>
              {isSidebarCollapsed && <TooltipContent side="right">Logout</TooltipContent>}
            </Tooltip>
          </div>
        </div>

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
              <DialogTitle>Edit folder</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3 py-2">
              <div className="grid gap-2">
                <Label htmlFor="edit-folder-name">Name</Label>
                <Input
                  id="edit-folder-name"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  aria-label="Folder name"
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
                        renameColor === c ? "ring-primary" : "ring-transparent"
                      )}
                      style={{ backgroundColor: c }}
                      aria-label={`Select color ${c}`}
                      onClick={() => setRenameColor(c)}
                    />
                  ))}
                </div>
              </div>
            </div>
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
                      color: renameColor || renameTarget.color,
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
    </TooltipProvider>
  );
}
