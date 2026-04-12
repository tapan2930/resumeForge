"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  FileText,
  Folder,
  FolderPlus,
  Home,
  ScanLine,
  Settings,
  Sparkles,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useAppStore } from "@/stores/useAppStore";
import type { ResumeVersion } from "@/lib/types";

export function CommandPaletteHost() {
  const [open, setOpen] = useState(false);
  const [resumes, setResumes] = useState<ResumeVersion[]>([]);
  const router = useRouter();
  const pathname = usePathname();
  
  const activeFolderId = useAppStore((s) => s.activeFolderId);
  const setActiveFolderId = useAppStore((s) => s.setActiveFolderId);
  const addVersion = useAppStore((s) => s.addVersion);
  const folders = useAppStore((s) => s.folders);
  const getRecentVersions = useAppStore((s) => s.getRecentVersions);

  const onKey = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      setOpen(true);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onKey]);

  useEffect(() => {
    if (open) {
      void getRecentVersions(50).then(setResumes);
    }
  }, [open, getRecentVersions]);

  const isResume = pathname?.startsWith("/resume/");

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search…" />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        
        {folders.length > 0 && (
          <CommandGroup heading="Folders">
            {folders.map((f) => (
              <CommandItem
                key={f.id}
                value={`folder ${f.name}`}
                className="cursor-pointer"
                onSelect={() => {
                  setOpen(false);
                  setActiveFolderId(f.id);
                  router.push("/dashboard");
                }}
              >
                <Folder className="mr-2 h-4 w-4" style={{ color: f.color }} />
                {f.name}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {resumes.length > 0 && (
          <CommandGroup heading="Recent Resumes">
            {resumes.map((r) => (
              <CommandItem
                key={r.id}
                value={`resume ${r.title}`}
                className="cursor-pointer"
                onSelect={() => {
                  setOpen(false);
                  router.push(`/resume/${r.id}`);
                }}
              >
                <FileText className="mr-2 h-4 w-4" />
                {r.title}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {folders.length > 0 && <CommandSeparator />}

        <CommandGroup heading="Navigate">
          <CommandItem
            className="cursor-pointer"
            onSelect={() => {
              setOpen(false);
              router.push("/dashboard");
            }}
          >
            <Home className="mr-2 h-4 w-4" />
            Dashboard
          </CommandItem>
          <CommandItem
            className="cursor-pointer"
            onSelect={() => {
              setOpen(false);
              router.push("/settings");
            }}
          >
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Resume">
          {activeFolderId && (
            <CommandItem
              className="cursor-pointer"
              onSelect={async () => {
                setOpen(false);
                const v = await addVersion(activeFolderId);
                router.push(`/resume/${v.id}`);
              }}
            >
              <FileText className="mr-2 h-4 w-4" />
              New version in active folder
            </CommandItem>
          )}
          <CommandItem
            className="cursor-pointer"
            onSelect={() => {
              setOpen(false);
              if (folders[0]) {
                router.push("/");
              }
            }}
          >
            <FolderPlus className="mr-2 h-4 w-4" />
            Manage folders on dashboard
          </CommandItem>
        </CommandGroup>
        {isResume && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Editor (this page)">
              <CommandItem
                className="cursor-pointer"
                onSelect={() => {
                  setOpen(false);
                  window.dispatchEvent(new CustomEvent("resumeforge:scan"));
                }}
              >
                <ScanLine className="mr-2 h-4 w-4" />
                Scan resume
              </CommandItem>
              <CommandItem
                className="cursor-pointer"
                onSelect={() => {
                  setOpen(false);
                  window.dispatchEvent(new CustomEvent("resumeforge:tailor"));
                }}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Tailor for job
              </CommandItem>
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
