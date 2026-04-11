/**
 * Resume versions in IndexedDB.
 * Future: replace with Supabase/PostgreSQL — isolate calls here.
 */
import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { ResumeVersion, CustomTemplate } from "@/lib/types";

const DB_NAME = "resumeforge";
const DB_VERSION = 2;
const STORE = "versions";
const TEMPLATE_STORE = "customTemplates";

interface RFSchema extends DBSchema {
  versions: {
    key: string;
    value: ResumeVersion;
    indexes: { "by-folder": string };
  };
  customTemplates: {
    key: string;
    value: CustomTemplate;
  };
}

let dbPromise: Promise<IDBPDatabase<RFSchema>> | null = null;

export function getDB(): Promise<IDBPDatabase<RFSchema>> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB unavailable"));
  }
  if (!dbPromise) {
    dbPromise = openDB<RFSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          const store = db.createObjectStore(STORE, { keyPath: "id" });
          store.createIndex("by-folder", "folderId");
        }
        if (!db.objectStoreNames.contains(TEMPLATE_STORE)) {
          db.createObjectStore(TEMPLATE_STORE, { keyPath: "id" });
        }
      },
    });
  }
  return dbPromise;
}

export async function putVersion(version: ResumeVersion): Promise<void> {
  const db = await getDB();
  await db.put(STORE, version);
}

export async function getVersion(id: string): Promise<ResumeVersion | undefined> {
  const db = await getDB();
  return db.get(STORE, id);
}

export async function deleteVersion(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORE, id);
}

export async function listVersionsByFolder(
  folderId: string
): Promise<ResumeVersion[]> {
  const db = await getDB();
  const idx = db.transaction(STORE).store.index("by-folder");
  return idx.getAll(folderId);
}

/** All versions (for dashboard recent list). */
export async function listAllVersions(): Promise<ResumeVersion[]> {
  const db = await getDB();
  return db.getAll(STORE);
}

export async function importVersions(
  versions: ResumeVersion[],
  merge = true
): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(STORE, "readwrite");
  if (!merge) {
    await tx.store.clear();
  }
  for (const v of versions) {
    await tx.store.put(v);
  }
  await tx.done;
}

/** Custom templates logic. */

export async function putTemplate(template: CustomTemplate): Promise<void> {
  const db = await getDB();
  // @ts-ignore — schema mismatch in tx across versions
  await db.put(TEMPLATE_STORE, template);
}

export async function getTemplate(
  id: string
): Promise<CustomTemplate | undefined> {
  const db = await getDB();
  // @ts-ignore
  return db.get(TEMPLATE_STORE, id);
}

export async function deleteTemplate(id: string): Promise<void> {
  const db = await getDB();
  // @ts-ignore
  await db.delete(TEMPLATE_STORE, id);
}

export async function listAllTemplates(): Promise<CustomTemplate[]> {
  const db = await getDB();
  // @ts-ignore
  return db.getAll(TEMPLATE_STORE);
}
