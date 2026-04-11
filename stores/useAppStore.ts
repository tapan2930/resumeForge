"use client";

import { create } from "zustand";
import type { JSONContent } from "@tiptap/core";
import type {
  CustomTemplate,
  ResumeFolder,
  ResumeTemplate,
  ResumeVersion,
} from "@/lib/types";
import { generateId } from "@/lib/utils";
import { emptyDocument } from "@/lib/default-content";
import {
  loadFoldersFromStorage,
  saveFoldersToStorage,
} from "@/lib/storage";
import {
  deleteTemplate,
  deleteVersion as idbDelete,
  getTemplate,
  getVersion,
  listAllTemplates,
  listVersionsByFolder,
  listAllVersions,
  putTemplate,
  putVersion,
} from "@/lib/idb";

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

  hydrate: () => void;
  setActiveFolderId: (id: string | null) => void;

  addFolder: (name: string, color: string) => ResumeFolder;
  updateFolder: (id: string, patch: Partial<Pick<ResumeFolder, "name" | "color">>) => void;
  deleteFolder: (id: string) => void;

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

  hydrate: () => {
    const folders = loadFoldersFromStorage();
    set({
      folders,
      hydrated: true,
      activeFolderId: folders[0]?.id ?? null,
    });
    void get().loadTemplates();
  },

  setActiveFolderId: (id) => set({ activeFolderId: id }),

  addFolder: (name, color) => {
    const folder: ResumeFolder = {
      id: generateId(),
      name,
      color,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    const folders = [...get().folders, folder];
    saveFoldersToStorage(folders);
    set({ folders, activeFolderId: folder.id });
    return folder;
  },

  updateFolder: (id, patch) => {
    const folders = get().folders.map((f) =>
      f.id === id
        ? { ...f, ...patch, updatedAt: nowIso() }
        : f
    );
    saveFoldersToStorage(folders);
    set({ folders });
  },

  deleteFolder: (id) => {
    const folders = get().folders.filter((f) => f.id !== id);
    saveFoldersToStorage(folders);
    const { versionsCache, activeFolderId } = get();
    const nextCache = { ...versionsCache };
    delete nextCache[id];
    const nextActive =
      activeFolderId === id ? (folders[0]?.id ?? null) : activeFolderId;
    set({
      folders,
      versionsCache: nextCache,
      activeFolderId: nextActive,
    });
    // Orphan versions remain in IDB until manual cleanup — optional: delete all by folder
    void (async () => {
      const list = await listVersionsByFolder(id);
      for (const v of list) {
        await idbDelete(v.id);
      }
    })();
  },

  loadVersionsForFolder: async (folderId) => {
    const list = await listVersionsByFolder(folderId);
    const sorted = list.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    set((s) => ({
      versionsCache: { ...s.versionsCache, [folderId]: sorted },
    }));
    return sorted;
  },

  getVersionById: (id) => getVersion(id),

  addVersion: async (folderId, partial) => {
    const t = nowIso();
    const version: ResumeVersion = {
      id: generateId(),
      folderId,
      title: partial?.title ?? "Untitled version",
      content: partial?.content ?? emptyDocument,
      template: partial?.template ?? "minimal",
      margins: { preset: "default", horizontal: 48, vertical: 48 },
      linkSettings: { color: "#1a1a1a", underline: true },
      atsScore: null,
      grammarScore: null,
      isTailored: false,
      tags: [],
      createdAt: t,
      updatedAt: t,
    };
    await putVersion(version);
    const list = await get().loadVersionsForFolder(folderId);
    return version;
  },

  updateVersion: async (id, patch) => {
    const existing = await getVersion(id);
    if (!existing) return;
    const folderId = existing.folderId;
    const next: ResumeVersion = {
      ...existing,
      ...patch,
      updatedAt: nowIso(),
    };
    await putVersion(next);
    await get().loadVersionsForFolder(folderId);
  },

  duplicateVersion: async (id) => {
    const existing = await getVersion(id);
    if (!existing) return null;
    const t = nowIso();
    const copy: ResumeVersion = {
      ...existing,
      id: generateId(),
      content: structuredClone(existing.content),
      title: `${existing.title} (copy)`,
      isTailored: false,
      jobTitle: undefined,
      companyName: undefined,
      relevanceScore: undefined,
      createdAt: t,
      updatedAt: t,
    };
    await putVersion(copy);
    await get().loadVersionsForFolder(existing.folderId);
    return copy;
  },

  removeVersion: async (id, folderId) => {
    const existing = await getVersion(id);
    if (!existing) return;
    await idbDelete(id);
    const prev = get().lastDeleted;
    if (prev) clearTimeout(prev.timeoutId);
    const timeoutId = setTimeout(() => {
      set((s) =>
        s.lastDeleted?.version.id === id ? { lastDeleted: null } : {}
      );
    }, 10000);
    set({
      lastDeleted: { version: existing, folderId, timeoutId },
    });
    await get().loadVersionsForFolder(folderId);
  },

  undoDeleteVersion: async () => {
    const ld = get().lastDeleted;
    if (!ld) return;
    clearTimeout(ld.timeoutId);
    await putVersion(ld.version);
    set({ lastDeleted: null });
    await get().loadVersionsForFolder(ld.folderId);
  },

  getRecentVersions: async (limit = 8) => {
    const all = await listAllVersions();
    return all
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )
      .slice(0, limit);
  },

  loadTemplates: async () => {
    const list = await listAllTemplates();
    set({ customTemplates: list });
  },

  getTemplateById: (id) => getTemplate(id),

  addTemplate: async (name) => {
    const t = nowIso();
    const template: CustomTemplate = {
      id: generateId(),
      name,
      nodes: {
        h1: {
          html: '<h1 style="font-size:24px; font-weight:bold; margin-bottom:12px; color:#1a1a1a;">{{content}}</h1>',
        },
        h2: {
          html: '<h2 style="font-size:18px; font-weight:semibold; margin-top:20px; margin-bottom:8px; color:#444; border-bottom:1px solid #ddd; padding-bottom:4px;">{{content}}</h2>',
        },
        h3: {
          html: '<h3 style="font-size:16px; font-weight:semibold; margin-top:12px; margin-bottom:4px; color:#1a1a1a;">{{content}}</h3>',
        },
        p: {
          html: '<p style="font-size:14px; margin-bottom:8px; line-height:1.5; color:#333;">{{content}}</p>',
        },
        ul: {
          html: '<ul style="padding-left:20px; margin-bottom:12px; list-style-type:disc;">{{content}}</ul>',
        },
        ol: {
          html: '<ol style="padding-left:20px; margin-bottom:12px; list-style-type:decimal;">{{content}}</ol>',
        },
        li: {
          html: '<li style="margin-bottom:4px; font-size:14px; color:#333;">{{content}}</li>',
        },
        hr: {
          html: '<hr style="border:none; border-top:1px solid #ddd; margin:16px 0;" />',
        },
        section: {
          default: {
            html: '<section style="margin-bottom:16px;">{{content}}</section>',
          },
          overrides: {},
        } as any,
        page: {
          html: '<div style="background:white; color:#1a1a1a;">{{content}}</div>',
        },
        overrides: {},
      },
      createdAt: t,
      updatedAt: t,
    };
    await putTemplate(template);
    await get().loadTemplates();
    return template;
  },

  importCustomTemplate: async (data) => {
    const t = nowIso();
    const template: CustomTemplate = {
      ...data,
      id: generateId(),
      createdAt: t,
      updatedAt: t,
    };
    await putTemplate(template);
    await get().loadTemplates();
    return template;
  },

  updateTemplate: async (id, template) => {
    const next = { ...template, id, updatedAt: nowIso() };
    await putTemplate(next);
    await get().loadTemplates();
  },

  removeTemplate: async (id) => {
    await deleteTemplate(id);
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
