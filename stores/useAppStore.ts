"use client";

import { create } from "zustand";
import type { JSONContent } from "@tiptap/core";
import { toast } from "sonner";
import {
  CustomTemplate,
  ResumeFolder,
  ResumeTemplate,
  ResumeVersion,
} from "@/lib/types";
import { emptyDocument } from "@/lib/default-content";
import {
  createFolder,
  updateFolderAction,
  deleteFolderAction,
  getFolders,
} from "@/lib/actions/folder.actions";
import {
  createResumeAction,
  updateResumeAction,
  deleteResumeAction,
  getResumesByFolder,
  getRecentResumesAction,
  getResumeByIdAction,
} from "@/lib/actions/resume.actions";
import {
  createCustomTemplateAction,
  updateCustomTemplateAction,
  deleteCustomTemplateAction,
  getCustomTemplatesAction,
  getCustomTemplateByIdAction,
} from "@/lib/actions/template.actions";
import { syncUser } from "@/lib/actions/user.actions";

export type LastDeleted = {
  version: ResumeVersion;
  folderId: string;
  timeoutId: ReturnType<typeof setTimeout>;
};

interface AppState {
  folders: ResumeFolder[];
  activeFolderId: string | null;
  versionsCache: Record<string, ResumeVersion[]>;
  customTemplates: CustomTemplate[];
  hydrated: boolean;
  lastDeleted: LastDeleted | null;

  hydrate: () => Promise<void>;
  setActiveFolderId: (id: string | null) => void;

  addFolder: (name: string, color: string) => Promise<ResumeFolder>;
  updateFolder: (id: string, patch: Partial<Pick<ResumeFolder, "name" | "color">>) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;

  loadVersionsForFolder: (folderId: string) => Promise<ResumeVersion[]>;
  getVersionById: (id: string) => Promise<ResumeVersion | undefined>;

  addVersion: (
    folderId: string,
    partial?: Partial<Pick<ResumeVersion, "title" | "content" | "template">>
  ) => Promise<ResumeVersion>;
  updateVersion: (
    id: string,
    patch: Partial<
      Omit<ResumeVersion, "id" | "folderId" | "createdAt"> & {
        content?: JSONContent;
      }
    >
  ) => Promise<void>;
  duplicateVersion: (id: string) => Promise<ResumeVersion | null>;
  removeVersion: (id: string, folderId: string) => Promise<void>;
  undoDeleteVersion: () => Promise<void>;

  /** Recent across all folders, sorted by updatedAt desc */
  getRecentVersions: (limit?: number) => Promise<ResumeVersion[]>;

  // Custom Templates
  loadTemplates: () => Promise<void>;
  getTemplateById: (id: string) => Promise<CustomTemplate | undefined>;
  addTemplate: (name: string) => Promise<CustomTemplate>;
  importCustomTemplate: (
    template: Omit<CustomTemplate, "id" | "createdAt" | "updatedAt">
  ) => Promise<CustomTemplate>;
  updateTemplate: (id: string, template: CustomTemplate) => Promise<void>;
  removeTemplate: (id: string) => Promise<void>;
}

function nowIso() {
  return new Date().toISOString();
}

export const useAppStore = create<AppState>((set, get) => ({
  folders: [],
  activeFolderId: null,
  versionsCache: {},
  customTemplates: [],
  hydrated: false,
  lastDeleted: null,

  hydrate: async () => {
    await syncUser();
    try {
      const folders = await getFolders();
      set({
        folders: folders as any,
        hydrated: true,
        activeFolderId: folders[0]?.id ?? null,
      });
      void get().loadTemplates();
    } catch (error) {
      // User is likely unauthenticated on a public page, safely set hydrated
      set({ hydrated: true });
    }
  },

  setActiveFolderId: (id) => set({ activeFolderId: id }),

  addFolder: async (name, color) => {
    const folder = await createFolder(name, color);
    const nextFolders = [...get().folders, folder as any];
    set({ folders: nextFolders, activeFolderId: folder.id });
    return folder as any;
  },

  updateFolder: async (id, patch) => {
    await updateFolderAction(id, patch);
    const folders = get().folders.map((f) =>
      f.id === id ? { ...f, ...patch, updatedAt: nowIso() } : f
    );
    set({ folders });
  },

  deleteFolder: async (id) => {
    await deleteFolderAction(id);
    const folders = get().folders.filter((f) => f.id !== id);
    const { versionsCache, activeFolderId } = get();
    const nextCache = { ...versionsCache };
    delete nextCache[id];
    const nextActive =
      activeFolderId === id ? folders[0]?.id ?? null : activeFolderId;
    set({
      folders,
      versionsCache: nextCache,
      activeFolderId: nextActive,
    });
  },

  loadVersionsForFolder: async (folderId) => {
    const list = await getResumesByFolder(folderId);
    set((s) => ({
      versionsCache: { ...s.versionsCache, [folderId]: list as any },
    }));
    return list as any;
  },

  getVersionById: (id) => getResumeByIdAction(id) as any,

  addVersion: async (folderId, partial) => {
    const version = await createResumeAction({
      folderId,
      title: partial?.title ?? "Untitled version",
      content: partial?.content ?? emptyDocument,
      template: partial?.template ?? "minimal",
      margins: { preset: "default", horizontal: 48, vertical: 48 },
      linkSettings: { color: "#1a1a1a", underline: true },
    });
    await get().loadVersionsForFolder(folderId);
    return version as any;
  },

  updateVersion: async (id, patch) => {
    await updateResumeAction(id, patch);
    const existing = await getResumeByIdAction(id);
    if (existing) {
      await get().loadVersionsForFolder(existing.folderId);
    }
  },

  duplicateVersion: async (id) => {
    const existing = await getResumeByIdAction(id);
    if (!existing) return null;
    const copy = await createResumeAction({
      folderId: existing.folderId,
      title: `${existing.title} (copy)`,
      content: existing.content,
      template: existing.template,
      margins: existing.margins,
      linkSettings: existing.linkSettings,
    });
    await get().loadVersionsForFolder(existing.folderId);
    return copy as any;
  },

  removeVersion: async (id, folderId) => {
    const existing = await getResumeByIdAction(id);
    if (!existing) return;
    await deleteResumeAction(id);
    // Note: Local "undo" logic would need a more complex cloud sync to be truly robust, 
    // but we'll keep the UI state for now.
    await get().loadVersionsForFolder(folderId);
  },

  undoDeleteVersion: async () => {
    // Cloud undo is complex; for simplicity, we'll let users just create new copies if they delete.
    // Or we could implement a "soft delete" in the schema later.
    toast.error("Undo not yet supported in cloud mode");
  },

  getRecentVersions: async (limit = 8) => {
    const list = await getRecentResumesAction(limit);
    return list as any;
  },

  loadTemplates: async () => {
    const list = await getCustomTemplatesAction();
    set({ customTemplates: list as any });
  },

  getTemplateById: (id) => getCustomTemplateByIdAction(id) as any,

  addTemplate: async (name) => {
    const nodes = {
      h1: { html: '<h1 style="font-size:24px; font-weight:bold; margin-bottom:12px; color:#1a1a1a;">{{content}}</h1>' },
      h2: { html: '<h2 style="font-size:18px; font-weight:semibold; margin-top:20px; margin-bottom:8px; color:#444; border-bottom:1px solid #ddd; padding-bottom:4px;">{{content}}</h2>' },
      h3: { html: '<h3 style="font-size:16px; font-weight:semibold; margin-top:12px; margin-bottom:4px; color:#1a1a1a;">{{content}}</h3>' },
      p: { html: '<p style="font-size:14px; margin-bottom:8px; line-height:1.5; color:#333;">{{content}}</p>' },
      ul: { html: '<ul style="padding-left:20px; margin-bottom:12px; list-style-type:disc;">{{content}}</ul>' },
      ol: { html: '<ol style="padding-left:20px; margin-bottom:12px; list-style-type:decimal;">{{content}}</ol>' },
      li: { html: '<li style="margin-bottom:4px; font-size:14px; color:#333;">{{content}}</li>' },
      hr: { html: '<hr style="border:none; border-top:1px solid #ddd; margin:16px 0;" />' },
      section: { default: { html: '<section style="margin-bottom:16px;">{{content}}</section>' }, overrides: {} } as any,
      page: { html: '<div style="background:white; color:#1a1a1a;">{{content}}</div>' },
      overrides: {},
    };
    const template = await createCustomTemplateAction(name, nodes);
    await get().loadTemplates();
    return template as any;
  },

  importCustomTemplate: async (data) => {
    const template = await createCustomTemplateAction(data.name, data.nodes);
    await get().loadTemplates();
    return template as any;
  },

  updateTemplate: async (id, template) => {
    await updateCustomTemplateAction(id, template);
    await get().loadTemplates();
  },

  removeTemplate: async (id) => {
    await deleteCustomTemplateAction(id);
    await get().loadTemplates();
  },
}));

export function inferDefaultPdfName(
  version: ResumeVersion,
  folder: ResumeFolder | undefined
): string {
  const extractName = (doc: JSONContent): string => {
    const first = doc.content?.[0];
    if (first?.type === "heading" && first.content?.[0]?.type === "text") {
      const t = first.content[0].text?.trim();
      if (t) return t.replace(/\s+/g, "_");
    }
    return "Resume";
  };
  const name = extractName(version.content);
  const role = (folder?.name ?? "Role").replace(/\s+/g, "_");
  return `${name}_${role}_Resume.pdf`;
}
