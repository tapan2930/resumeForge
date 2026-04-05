"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  FileText,
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

export function CommandPaletteHost() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const activeFolderId = useAppStore((s) => s.activeFolderId);
  const addVersion = useAppStore((s) => s.addVersion);
  const folders = useAppStore((s) => s.folders);

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

  const isResume = pathname?.startsWith("/resume/");

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search…" />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        <CommandGroup heading="Navigate">
          <CommandItem
            className="cursor-pointer"
            onSelect={() => {
              setOpen(false);
              router.push("/");
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
